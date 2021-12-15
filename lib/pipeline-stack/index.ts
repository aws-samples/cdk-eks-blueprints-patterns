import * as cdk from '@aws-cdk/core';
import { StackProps } from '@aws-cdk/core';
// SSP Lib
import * as ssp from '@aws-quickstart/ssp-amazon-eks';
import { AwsLoadBalancerControllerAddOn } from '@aws-quickstart/ssp-amazon-eks';
// Team implementations
import * as team from '../teams';



export default class PipelineConstruct extends cdk.Construct {

    constructor(scope: cdk.Construct, id: string, props?: StackProps) {
        super(scope, id);
        process.env.JSII_DEPRECATED = 'quiet';
        const account = process.env.CDK_DEFAULT_ACCOUNT!;
        const blueprint = ssp.EksBlueprint.builder()
            .account(account) // the supplied default will fail, but build and synth will pass
            .region('us-west-1')
            .addOns(
                new AwsLoadBalancerControllerAddOn, 
                new ssp.NginxAddOn,
                new ssp.ArgoCDAddOn,
                new ssp.AppMeshAddOn( {
                    enableTracing: true
                }),
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
                    manualApprovals: true
                }
            })
            .build(scope, "ssp-pipeline-stack", props);
    }
}