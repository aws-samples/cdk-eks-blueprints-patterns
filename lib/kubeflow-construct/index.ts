import { Construct } from 'constructs';
import * as blueprints from '@aws-quickstart/eks-blueprints'
import { KubeflowAddOn } from 'eks-blueprints-cdk-kubeflow-ext';


export default class KubeflowConstruct {
    constructor(scope: Construct, id: string) {
        // AddOns for the cluster
        const stackId = `${id}-blueprint`;
        blueprints.EksBlueprint.builder()
            .account(process.env.CDK_DEFAULT_ACCOUNT!)
            .region(process.env.CDK_DEFAULT_REGION)
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
                new blueprints.AmpAddOn(),
                new KubeflowAddOn({
                     namespace: 'kubeflow-pipelines'
                 })
            )
            .teams()// add teams here)
            .build(scope, stackId);
    }
}
