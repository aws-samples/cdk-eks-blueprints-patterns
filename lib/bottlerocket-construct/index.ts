import * as eks from 'aws-cdk-lib/aws-eks';
import { Construct } from 'constructs';

// Blueprints Lib
import * as blueprints from '@aws-quickstart/eks-blueprints'

// Team implementations
import * as team from '../teams'

export default class BottlerocketConstruct extends Construct {
    constructor(scope: Construct, id: string) {
        super(scope, id);

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
            new blueprints.CalicoAddOn,
            new blueprints.MetricsServerAddOn,
            new blueprints.ContainerInsightsAddOn,
            new blueprints.SecretsStoreAddOn
        ];

        const stackID = `${id}-blueprint`;
        const clusterProvider = new blueprints.MngClusterProvider({
            version: eks.KubernetesVersion.V1_21,
            amiType: eks.NodegroupAmiType.BOTTLEROCKET_X86_64
         });
        new blueprints.EksBlueprint(scope, { id: stackID, teams, addOns, clusterProvider }, {
            env: {
                region: 'us-east-1'
            }
        });
    }
}


