import { Construct } from 'constructs';

// Blueprints Lib
import * as blueprints from '@aws-quickstart/eks-blueprints';

// Team implementations
import * as team from '../teams/multi-account-monitoring';

/**
 * Demonstrates how to leverage more than one node group along with Fargate profiles.
 */
export default class AmpMonitoringConstruct {
    build(scope: Construct, id: string, account?: string, region?: string ) {
        // Setup platform team
        const accountID = account ?? process.env.CDK_DEFAULT_ACCOUNT! ;
        const awsRegion =  region ?? process.env.CDK_DEFAULT_REGION! ;
 
        const stackID = `${id}-blueprint`;
        this.create(scope, accountID, awsRegion)
            .build(scope, stackID);
    }

    create(scope: Construct, account?: string, region?: string ) {
        // Setup platform team
        const accountID = account ?? process.env.CDK_DEFAULT_ACCOUNT! ;
        const awsRegion =  region ?? process.env.CDK_DEFAULT_REGION! ;

        return blueprints.EksBlueprint.builder()
            .account(accountID)
            .region(awsRegion)
            .addOns(
                new blueprints.CertManagerAddOn,
                new blueprints.AdotCollectorAddOn,
                new blueprints.AmpAddOn,
                new blueprints.XrayAdotAddOn,
                new blueprints.AwsLoadBalancerControllerAddOn,
                new blueprints.NginxAddOn,
                new blueprints.ClusterAutoScalerAddOn,
                new blueprints.SecretsStoreAddOn
            )
            .teams(new team.TeamGeordi, new team.CorePlatformTeam);
    }
}


