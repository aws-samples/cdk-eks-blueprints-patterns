import { StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
// Blueprints Lib
import * as blueprints from '@aws-quickstart/eks-blueprints';
// Team implementations
import * as team from '../teams';

const burnhamManifestDir = './lib/teams/team-burnham/'
const rikerManifestDir = './lib/teams/team-riker/'
const teamManifestDirList = [burnhamManifestDir,rikerManifestDir]


export default class PipelineConstruct {

    async buildAsync(scope: Construct, props?: StackProps) {
    
        await this.prevalidateSecrets();

        const account = process.env.CDK_DEFAULT_ACCOUNT!;
        const blueprint = blueprints.EksBlueprint.builder()
            .account(account) // the supplied default will fail, but build and synth will pass
            .region('us-west-1')
            .addOns(
                new blueprints.AwsLoadBalancerControllerAddOn, 
                new blueprints.NginxAddOn,
                new blueprints.SecretsStoreAddOn,
                new blueprints.ArgoCDAddOn,
                new blueprints.MetricsServerAddOn,
                new blueprints.ClusterAutoScalerAddOn
                )
            .teams(
                new team.TeamRikerSetup(scope, teamManifestDirList[1]),
                new team.TeamBurnhamSetup(scope, teamManifestDirList[0])
            );

        blueprints.CodePipelineStack.builder()
            .name("blueprints-eks-pipeline")
            .owner("aws-samples")
            .repository({
                repoUrl: 'cdk-eks-blueprints-patterns',
                credentialsSecretName: 'github-token',
                targetRevision: 'private-cluster'
            })
            .wave( {
                id: "dev",
                stages: [
                    { id: "dev-west-1", stackBuilder: blueprint.clone('us-west-1')
                        // .addOns(new NewRelicAddOn({
                        //     version: "4.2.0-beta",
                        //     newRelicClusterName: "dev-west-1",
                        //     awsSecretName: "newrelic-pixie-combined",
                        // }))
                    },
                    { id: "dev-east-2", stackBuilder: blueprint.clone('us-east-2')
                        // .addOns(new NewRelicAddOn({
                        //     version: "4.2.0-beta",
                        //     newRelicClusterName: "dev-east-2",
                        //     awsSecretName: "newrelic-pixie-combined",
                        // }))
                    },
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