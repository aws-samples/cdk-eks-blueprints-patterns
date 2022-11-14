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
                new blueprints.ClusterAutoScalerAddOn(),
                new blueprints.AwsLoadBalancerControllerAddOn(),
                new blueprints.VpcCniAddOn(),
                new blueprints.CoreDnsAddOn(),
                new blueprints.KubeProxyAddOn(),
                new blueprints.EbsCsiDriverAddOn(),
                new KubeflowAddOn({
                     namespace: 'kubeflow-pipelines'
                 })
            )
            .teams()// add teams here)
            .build(scope, stackId);
    }
}
