import * as eks from 'aws-cdk-lib/aws-eks';
import { Construct } from 'constructs';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import * as team from '../teams';

/**
 * Bottlerocket pattern shows how to specify the OS for the node group
 * and leverage container-optimized Bottlerocket OS: https://aws.amazon.com/bottlerocket/
 */
export default class BottlerocketConstruct {
    
    build(scope: Construct, id: string) {
 
        const stackID = `${id}-blueprint`;
        const accountID = process.env.CDK_DEFAULT_ACCOUNT!;
        const platformTeam = new team.TeamPlatform(accountID);
 
        const clusterProvider = new blueprints.MngClusterProvider({
            version: eks.KubernetesVersion.V1_25,
            amiType: eks.NodegroupAmiType.BOTTLEROCKET_X86_64
        });
        
        blueprints.EksBlueprint.builder()
            .account(accountID)
            .region('us-east-1')
            .clusterProvider(clusterProvider)
            .addOns(
                new blueprints.AwsLoadBalancerControllerAddOn,
                new blueprints.CertManagerAddOn,
                new blueprints.AdotCollectorAddOn,
                new blueprints.AppMeshAddOn,
                new blueprints.ClusterAutoScalerAddOn,
                new blueprints.NginxAddOn,
                new blueprints.ArgoCDAddOn,
                new blueprints.CalicoOperatorAddOn,
                new blueprints.MetricsServerAddOn,
                new blueprints.CloudWatchAdotAddOn,
                new blueprints.SecretsStoreAddOn
            )
            .teams(platformTeam)
            .build(scope, stackID);
    }
}


