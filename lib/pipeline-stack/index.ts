import * as cdk from '@aws-cdk/core';
import { StackProps } from '@aws-cdk/core';
// SSP Lib
import * as ssp from '@aws-quickstart/ssp-amazon-eks';
// Team implementations
import * as team from '../teams';
import { getSecretValue } from '@aws-quickstart/ssp-amazon-eks/dist/utils/secrets-manager-utils';


export default class PipelineConstruct {

    async buildAsync(scope: cdk.Construct, id: string, props?: StackProps) {
        try {
            await getSecretValue('github-token', 'us-east-2');
            await getSecretValue('github-token', 'us-west-1');
        }
        catch(error) {
            throw new Error(`github-token secret must be setup in AWS Secrets Manager for the GitHub pipeline.
            The GitHub Personal Access Token should have these scopes:
            * **repo** - to read the repository
            * * **admin:repo_hook** - if you plan to use webhooks (true by default)
            * @see https://docs.aws.amazon.com/codepipeline/latest/userguide/GitHub-create-personal-token-CLI.html`);
        }
        const account = process.env.CDK_DEFAULT_ACCOUNT!;
        const blueprint = ssp.EksBlueprint.builder()
            .account(account) // the supplied default will fail, but build and synth will pass
            .region('us-west-1')
            .addOns(
                new ssp.AwsLoadBalancerControllerAddOn, 
                new ssp.NginxAddOn,
                new ssp.ArgoCDAddOn,
                new ssp.AppMeshAddOn( {
                    enableTracing: true
                }),
                new ssp.SSMAgentAddOn, // this is added to deal with PVRE as it is adding correct role to the node group, otherwise stack destroy won't work
                new ssp.CalicoAddOn,
                new ssp.MetricsServerAddOn,
                new ssp.ClusterAutoScalerAddOn,
                new ssp.ContainerInsightsAddOn)
            .teams(new team.TeamRikerSetup);

        ssp.CodePipelineStack.builder()
            .name("ssp-eks-pipeline")
            .owner("aws-samples")
            .repository({
                repoUrl: 'ssp-eks-patterns',
                credentialsSecretName: 'github-token',
                targetRevision: 'main'
            })
            .stage({
                id: 'us-west-1-managed-ssp',
                stackBuilder: blueprint.clone('us-west-1')
            })
            .stage({
                id: 'us-east-2-managed-ssp',
                stackBuilder: blueprint.clone('us-east-2'),
                stageProps: {
                    pre: [new ssp.pipelines.cdkpipelines.ManualApprovalStep('manual-approval')]
                }
            })
            .build(scope, "ssp-pipeline-stack", props);
    }
}