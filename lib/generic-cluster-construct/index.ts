import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as eks from 'aws-cdk-lib/aws-eks';

// Blueprints Lib
import * as blueprints from '@aws-quickstart/eks-blueprints';

// Team implementations
import * as team from '../teams';

/**
 * Demonstrates how to leverage more than one node group along with Fargate profiles.
 */
export default class GenericClusterConstruct {
    build(scope: Construct, id: string) {
        // Setup platform team
        const accountID = process.env.CDK_DEFAULT_ACCOUNT!;
        const platformTeam = new team.TeamPlatform(accountID);
 
        const stackID = `${id}-blueprint`;
        
        const clusterProvider = new blueprints.GenericClusterProvider({
            version: eks.KubernetesVersion.V1_25,
            managedNodeGroups: [
                {
                    id: "mng-ondemand",
                    amiType: eks.NodegroupAmiType.AL2_X86_64,
                    instanceTypes: [new ec2.InstanceType('m5.2xlarge')]
                },
                {
                    id: "mng2-spot",
                    instanceTypes: [ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MEDIUM)],
                    nodeGroupCapacityType: eks.CapacityType.SPOT
                }
            ],
            fargateProfiles: {
                "fp1": {
                    fargateProfileName: "fp1",
                    selectors:  [{ namespace: "serverless1" }] 
                },
                "fp2": {
                    fargateProfileName: "fp2",
                    selectors:  [{ namespace: "serverless2" }] 
                }
            }
        });

        blueprints.EksBlueprint.builder()
            .account(accountID)
            .region(process.env.CDK_DEFAULT_REGION!)
            .clusterProvider(clusterProvider)
            .addOns(
                new blueprints.AwsLoadBalancerControllerAddOn,
                new blueprints.CertManagerAddOn,
                new blueprints.AdotCollectorAddOn,
                new blueprints.AppMeshAddOn,
                new blueprints.NginxAddOn,
                new blueprints.ArgoCDAddOn,
                new blueprints.CalicoOperatorAddOn,
                new blueprints.MetricsServerAddOn,
                new blueprints.ClusterAutoScalerAddOn,
                new blueprints.CloudWatchAdotAddOn,
                new blueprints.XrayAdotAddOn,
                new blueprints.SecretsStoreAddOn
            )
            .teams(platformTeam)
            .build(scope, stackID);
    }
}


