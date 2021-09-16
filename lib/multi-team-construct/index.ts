import * as cdk from '@aws-cdk/core';

// SSP Lib
import * as ssp from '@aws-quickstart/ssp-amazon-eks'
import { AwsLoadBalancerControllerAddOn } from '@aws-quickstart/ssp-amazon-eks';

// Team implementations
import * as team from '../teams'

export default class MultiTeamConstruct extends cdk.Construct {
    constructor(scope: cdk.Construct, id: string) {
        super(scope, id);

        // Setup platform team
        const accountID = process.env.CDK_DEFAULT_ACCOUNT!
        const platformTeam = new team.TeamPlatform(accountID)

        // Teams for the cluster.
        const teams: Array<ssp.Team> = [
            platformTeam,
            new team.TeamTroiSetup,
            new team.TeamRikerSetup,
            new team.TeamBurnhamSetup(scope)
        ];

        // AddOns for the cluster.
        const addOns: Array<ssp.ClusterAddOn> = [
            new ssp.AppMeshAddOn,
            new AwsLoadBalancerControllerAddOn,
            new ssp.NginxAddOn,
            new ssp.ArgoCDAddOn,
            new ssp.CalicoAddOn,
            new ssp.MetricsServerAddOn,
            new ssp.ClusterAutoScalerAddOn,
            new ssp.ContainerInsightsAddOn,
            new ssp.XrayAddOn
        ];

        const stackID = `${id}-blueprint`
        new ssp.EksBlueprint(scope, { id: stackID, addOns, teams }, {
            env: {
                region: 'us-east-2',
            },
        });
    }
}


