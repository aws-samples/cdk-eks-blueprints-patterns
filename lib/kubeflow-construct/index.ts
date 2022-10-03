import { Construct } from 'constructs';
import * as blueprints from '@aws-quickstart/eks-blueprints'
import { KubeflowAddOn } from 'eks-blueprints-cdk-kubeflow-ext';


export default class KubeflowConstruct {
    constructor(scope: Construct, id: string) {
        // AddOns for the cluster
        const stackId = `${id}-blueprint`;
        const account = '349361870252'
        const region = 'us-west-1'
        blueprints.EksBlueprint.builder()
            .account(account)
            .region(region)
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
