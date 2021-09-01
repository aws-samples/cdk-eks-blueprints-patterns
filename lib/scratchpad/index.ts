import * as cdk from '@aws-cdk/core';
import {KubernetesVersion}  from '@aws-cdk/aws-eks';

// SSP Lib
import * as ssp from '@shapirov/cdk-eks-blueprint';
import { EC2ClusterProvider } from '@shapirov/cdk-eks-blueprint';
import { TeamPlatform } from '../teams';


export default class ScratchpadConstruct extends cdk.Construct {
    constructor(scope: cdk.Construct, id: string) {
        super(scope, id);
        // AddOns for the cluster.
        const addOns: Array<ssp.ClusterAddOn> = [
            new ssp.AwsLoadBalancerControllerAddOn,
            new ssp.NginxAddOn,
            new ssp.MetricsServerAddOn,
            new ssp.ClusterAutoScalerAddOn
        ];

        const stackID = `${id}-blueprint`;

        const clusterProvider = new EC2ClusterProvider( {
            minSize: 3,
            desiredSize: 3,
            maxSize: 3,
            version: KubernetesVersion.V1_20
        });

        const team = new TeamPlatform(process.env.CDK_DEFAULT_ACCOUNT!);

        new ssp.EksBlueprint(scope, { id: stackID, addOns, clusterProvider, teams: [ team ] }, {
            env: {
                region: 'us-east-2',
            },
        });
    }
}
