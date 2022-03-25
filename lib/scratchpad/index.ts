import { Construct } from 'constructs';
import {KubernetesVersion}  from 'aws-cdk-lib/aws-eks';

// Blueprints Lib
import * as blueprints from '@aws-quickstart/eks-blueprints';


export default class ScratchpadConstruct {
    constructor(scope: Construct, id: string) {
        // AddOns for the cluster.
        const addOns: Array<blueprints.ClusterAddOn> = [
            new blueprints.AppMeshAddOn,
            new blueprints.AwsLoadBalancerControllerAddOn,
            new blueprints.NginxAddOn,
            new blueprints.ArgoCDAddOn,
            new blueprints.CalicoAddOn,
            new blueprints.MetricsServerAddOn,
            new blueprints.ClusterAutoScalerAddOn,
            new blueprints.ContainerInsightsAddOn,
            new blueprints.XrayAddOn,
            new blueprints.SecretsStoreAddOn
        ];

        const stackID = `${id}-blueprint`;

        const clusterProvider = new blueprints.MngClusterProvider( {
            desiredSize: 3,
            maxSize: 3,
            version: KubernetesVersion.V1_20
        });

        new blueprints.EksBlueprint(scope, { id: stackID, addOns, clusterProvider }, {
            env: {
                region: 'us-east-2',
            },
        });
    }
}
