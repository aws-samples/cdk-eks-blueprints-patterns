import { Construct } from 'constructs';

// Blueprints Lib
import * as blueprints from '@aws-quickstart/eks-blueprints';
import { ClusterAutoScalerAddOn, MetricsServerAddOn } from '@aws-quickstart/eks-blueprints';
import { ManagedPolicy } from 'aws-cdk-lib/aws-iam';



/**
 * Example starter with placeholders to add addOns and teams.
 */
export default class StarterConstruct {
    build(scope: Construct, id: string) {
        
        const stackID = `${id}-blueprint`
        blueprints.EksBlueprint.builder()
            .account(process.env.CDK_DEFAULT_ACCOUNT!)
            .region('us-west-2')
            .resourceProvider(blueprints.GlobalResources.Vpc, new blueprints.VpcProvider("vpc-01b52f57daeeca251"))
            .addOns( new MetricsServerAddOn,
                new ClusterAutoScalerAddOn,
            )
            .teams(new blueprints.ApplicationTeam({
                name: 'kyverno',
                namespace: 'kyverno',   
                serviceAccountName: 'kyverno',
                serviceAccountPolicies: [
                    ManagedPolicy.fromAwsManagedPolicyName('AWSMarketplaceMeteringFullAccess'),
                    ManagedPolicy.fromAwsManagedPolicyName('AWSMarketplaceMeteringRegisterUsage'),
                    ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLicenseManagerConsumptionPolicy'),
                ],
            }))// add teams here)
            .build(scope, stackID);
    }
}


