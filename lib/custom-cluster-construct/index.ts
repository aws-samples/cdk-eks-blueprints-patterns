import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as eks from 'aws-cdk-lib/aws-eks';

// Blueprints Lib
import * as blueprints from '@aws-quickstart/eks-blueprints'

// Team implementations
import * as team from '../teams'

export default class CustomClusterConstruct {
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
            new blueprints.CalicoAddOn,
            new blueprints.MetricsServerAddOn,
            new blueprints.ClusterAutoScalerAddOn,
            new blueprints.ContainerInsightsAddOn,
            new blueprints.XrayAddOn,
            new blueprints.SecretsStoreAddOn
        ];

        const clusterProps: blueprints.MngClusterProviderProps = {
            version: eks.KubernetesVersion.V1_20,
            instanceTypes: [new ec2.InstanceType('t3.large')],
            amiType: eks.NodegroupAmiType.AL2_X86_64
        }

        const stackID = `${id}-blueprint`
        const clusterProvider = new blueprints.MngClusterProvider(clusterProps);
        new blueprints.EksBlueprint(scope, { id: stackID, teams, addOns, clusterProvider });
    }
}


