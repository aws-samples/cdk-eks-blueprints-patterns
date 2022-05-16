import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as eks from 'aws-cdk-lib/aws-eks';
import { Construct } from 'constructs';

// Blueprints Lib
import * as blueprints from '@aws-quickstart/eks-blueprints';

// Team implementations
import * as team from '../teams';

/**
 * Demonstrates how to leverage more than one node group along with Fargate profiles.
 */
export default class PrivateClusterConstruct {
    build(scope: Construct, id: string) {
        // Setup platform team
        const accountID = process.env.CDK_DEFAULT_ACCOUNT!;
        const platformTeam = new team.TeamPlatform(accountID);
 
        const stackID = `${id}-blueprint`;
        
        const clusterProvider = new blueprints.GenericClusterProvider({
            version: eks.KubernetesVersion.V1_21,
            privateCluster: true,
            managedNodeGroups: [
                {
                    id: "mng-ondemand",
                    amiType: eks.NodegroupAmiType.AL2_X86_64,
                    instanceTypes: [new ec2.InstanceType('m5.2xlarge')],
                    vpcSubnets: [ {subnetType: ec2.SubnetType.PRIVATE_ISOLATED }]
                }
            ]
        });

        blueprints.EksBlueprint.builder()
            .account(accountID)
            .region(process.env.CDK_DEFAULT_REGION!)
            .clusterProvider(clusterProvider)
            // .addOns(
            //     new blueprints.AppMeshAddOn,
            //     new blueprints.AwsLoadBalancerControllerAddOn,
            //     new blueprints.NginxAddOn,
            //     new blueprints.ArgoCDAddOn,
            //     new blueprints.CalicoAddOn,
            //     new blueprints.MetricsServerAddOn,
            //     new blueprints.ClusterAutoScalerAddOn,
            //     new blueprints.ContainerInsightsAddOn,
            //     new blueprints.XrayAddOn,
            //     new blueprints.SecretsStoreAddOn
            // )
            .teams(platformTeam)
            .build(scope, stackID);
    }
}


