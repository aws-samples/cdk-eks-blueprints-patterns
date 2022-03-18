import * as cdk from '@aws-cdk/core';
import * as eks from '@aws-cdk/aws-eks';

// SSP Lib
import * as ssp from '@aws-quickstart/ssp-amazon-eks';

// Team implementations
import * as team from '../teams';

export default class BottlerocketConstruct extends cdk.Construct {
    constructor(scope: cdk.Construct, id: string) {
        super(scope, id);

        // Setup platform team
        const accountID = process.env.CDK_DEFAULT_ACCOUNT!
        const platformTeam = new team.TeamPlatform(accountID)
        const teams: Array<ssp.Team> = [platformTeam];

        // AddOns for the cluster.
        const addOns: Array<ssp.ClusterAddOn> = [
            new ssp.AppMeshAddOn,
            new ssp.AwsLoadBalancerControllerAddOn,
            new ssp.NginxAddOn,
            new ssp.ArgoCDAddOn,
            new ssp.CalicoAddOn,
            new ssp.MetricsServerAddOn,
            new ssp.ContainerInsightsAddOn,
            new ssp.SecretsStoreAddOn
        ];

        const stackID = `${id}-blueprint`;
        const clusterProvider = new ssp.AsgClusterProvider({
            version: eks.KubernetesVersion.V1_20,
            machineImageType:  eks.MachineImageType.BOTTLEROCKET
         });
        new ssp.EksBlueprint(scope, { id: stackID, teams, addOns, clusterProvider }, {
            env: {
                region: 'us-east-1'
            }
        });
    }
}
