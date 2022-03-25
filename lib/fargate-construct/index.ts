import { Construct } from 'constructs';
import * as eks from 'aws-cdk-lib/aws-eks';

// Blueprints Lib
import * as blueprints from '@aws-quickstart/eks-blueprints'

// Team implementations
import * as team from '../teams'

export default class FargateConstruct {
    constructor(scope: Construct, id: string) {
        // Setup platform team
        const accountID = process.env.CDK_DEFAULT_ACCOUNT!
        const platformTeam = new team.TeamPlatform(accountID)
        const teams: Array<blueprints.Team> = [platformTeam];

        // AddOns for the cluster.
        const addOns: Array<blueprints.ClusterAddOn> = [
            new blueprints.AppMeshAddOn,
            new blueprints.AwsLoadBalancerControllerAddOn,
            new blueprints.NginxAddOn,
            new blueprints.ArgoCDAddOn,
            new blueprints.MetricsServerAddOn
        ];

        // TODO - what is with dynatrace?
        const fargateProfiles: Map<string, eks.FargateProfileOptions> = new Map([
            ["dynatrace", { selectors: [{ namespace: "dynatrace" }] }]
        ]);

        const stackID = `${id}-blueprint`
        const clusterProvider = new blueprints.FargateClusterProvider({
            fargateProfiles,
            version: eks.KubernetesVersion.V1_20
        })
        new blueprints.EksBlueprint(scope, { id: stackID, teams, addOns, clusterProvider }, {
            env: {
                region: 'us-east-1'
            }
        })
    }
}



