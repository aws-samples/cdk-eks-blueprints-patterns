import { Construct } from 'constructs';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import { KubeflowAddOn } from 'eks-blueprints-cdk-kubeflow-ext';
import * as amp from 'aws-cdk-lib/aws-aps';


export default class KubeflowConstruct {
    constructor(scope: Construct, id: string) {
        // AddOns for the cluster
        const stackId = `${id}-blueprint`;
        const ampWorkspaceName = "kubeflow-monitoring";
        const ampPrometheusEndpoint = (blueprints.getNamedResource(ampWorkspaceName) as unknown as amp.CfnWorkspace).attrPrometheusEndpoint;

        blueprints.EksBlueprint.builder()
            .account(process.env.CDK_DEFAULT_ACCOUNT!)
            .region(process.env.CDK_DEFAULT_REGION)
            .resourceProvider(ampWorkspaceName, new blueprints.CreateAmpProvider(ampWorkspaceName, ampWorkspaceName))
            .addOns( new blueprints.MetricsServerAddOn(),
                new blueprints.AwsLoadBalancerControllerAddOn(),
                new blueprints.ClusterAutoScalerAddOn(),
                new blueprints.VpcCniAddOn(),
                new blueprints.CoreDnsAddOn(),
                new blueprints.KubeProxyAddOn(),
                new blueprints.EbsCsiDriverAddOn(),
                new blueprints.CertManagerAddOn(),
                new blueprints.KubeStateMetricsAddOn(),
                new blueprints.PrometheusNodeExporterAddOn(),
                new blueprints.AdotCollectorAddOn(),
                new blueprints.addons.AmpAddOn({
                    ampPrometheusEndpoint: ampPrometheusEndpoint,
                }),
                new KubeflowAddOn({
                    namespace: 'kubeflow-pipelines'
                })
            )
            .teams()// add teams here)
            .build(scope, stackId);
    }
}
