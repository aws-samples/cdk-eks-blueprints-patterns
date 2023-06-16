import { Construct } from 'constructs';
import { StackProps } from 'aws-cdk-lib';
// Blueprints Lib
import * as blueprints from '@aws-quickstart/eks-blueprints';
// Team implementations
import * as team from '../teams';

const burnhamManifestDir = './lib/teams/team-burnham/';
const rikerManifestDir = './lib/teams/team-riker/';
const teamManifestDirList = [burnhamManifestDir,rikerManifestDir];


export default class PipelineConstruct {

    async buildAsync(scope: Construct, props?: StackProps) {
    
        await this.prevalidateSecrets();

        const account = process.env.CDK_DEFAULT_ACCOUNT!;
        const blueprint = blueprints.EksBlueprint.builder()
            .account(account) // the supplied default will fail, but build and synth will pass
            .region('us-west-1')
            .addOns(
                new blueprints.AwsLoadBalancerControllerAddOn, 
                new blueprints.CertManagerAddOn,
                new blueprints.AdotCollectorAddOn,
                new blueprints.NginxAddOn,
                new blueprints.ArgoCDAddOn,
                new blueprints.AppMeshAddOn( {
                    enableTracing: true
                }),
                new blueprints.SSMAgentAddOn, // this is added to deal with PVRE as it is adding correct role to the node group, otherwise stack destroy won't work
                new blueprints.CalicoOperatorAddOn,
                new blueprints.MetricsServerAddOn,
                new blueprints.ClusterAutoScalerAddOn,
                new blueprints.CloudWatchAdotAddOn,
                new blueprints.XrayAdotAddOn,
                new blueprints.SecretsStoreAddOn)
            .teams(
                new team.TeamRikerSetup(scope, teamManifestDirList[1]),
                new team.TeamBurnhamSetup(scope, teamManifestDirList[0])
            );

        blueprints.CodePipelineStack.builder()
            .application("npx ts-node bin/pipeline.ts")
            .name("blueprints-eks-pipeline")
            .owner("aws-samples")
            .codeBuildPolicies(blueprints.DEFAULT_BUILD_POLICIES)
            .repository({
                repoUrl: 'cdk-eks-blueprints-patterns',
                credentialsSecretName: 'github-token',
                targetRevision: 'main'
            })
            .stage({
                id: 'us-west-1-sandbox',
                stackBuilder: blueprint.clone('us-west-1')
            })
            .wave( {
                id: "dev",
                stages: [
                    { id: "dev-west-1", stackBuilder: blueprint.clone('us-west-1')},
                    { id: "dev-east-2", stackBuilder: blueprint.clone('us-east-2')},
                ]
            })
            .stage({
                id: 'us-east-2-uat',
                stackBuilder: blueprint.clone('us-east-2'),
                stageProps: {
                    pre: [new blueprints.pipelines.cdkpipelines.ManualApprovalStep('manual-approval')]
                }
            })
            .wave( {
                id: "prod",
                stages: [
                    { id: "prod-west-1", stackBuilder: blueprint.clone('us-west-1')},
                    { id: "prod-east-2", stackBuilder: blueprint.clone('us-east-2')},
                ]
            })
            .build(scope, "pipeline", props);
    }

    async prevalidateSecrets() {
        try {
            await blueprints.utils.validateSecret('github-token', 'us-east-2');
            await blueprints.utils.validateSecret('github-token', 'us-west-1');
        }
        catch(error) {
            throw new Error(`github-token secret must be setup in AWS Secrets Manager for the GitHub pipeline.
            The GitHub Personal Access Token should have these scopes:
            * **repo** - to read the repository
            * * **admin:repo_hook** - if you plan to use webhooks (true by default)
            * @see https://docs.aws.amazon.com/codepipeline/latest/userguide/GitHub-create-personal-token-CLI.html`);
        }
    }
}