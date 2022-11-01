import { NestedStack, NestedStackProps } from 'aws-cdk-lib';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import { Construct } from 'constructs';
import {
    CloudFormationProduct,
    CloudFormationTemplate,
    MessageLanguage,
    Portfolio,
  } from 'aws-cdk-lib/aws-servicecatalog'
import * as cdk from 'aws-cdk-lib';
import AmpMonitoringConstruct from '../amp-monitoring';
import * as iam from 'aws-cdk-lib/aws-iam';

/**
 * Stack the creates the role with trust relationship to the monitoring account to 
 * get AMP metrics.
 */
export class ServiceCatalogSetupStack extends NestedStack {

    public static builder(roleName: string, trustAccount: string): blueprints.NestedStackBuilder {
        return {
            build(scope: Construct, id: string, props: NestedStackProps) {
                return new ServiceCatalogSetupStack(scope, id, props, roleName, trustAccount);
            }
        };
    }

    constructor(scope: Construct, id: string, props: NestedStackProps, roleName: string, trustAccount: string) {
        super(scope, id, props);


        const launchRole = new iam.Role(this, 'LaunchRole', {
          roleName: 'MY_FANCY_ROLE',
          assumedBy: new iam.ServicePrincipal('servicecatalog.amazonaws.com'),
        });
        
        
        const portfolio = new Portfolio(this, 'test-portfolio', {
            displayName: 'SomeDisplayName',
            description: 'SomeDesc',
            providerName: 'SomeProviderName',
            messageLanguage: MessageLanguage.EN,
          })
          portfolio.shareWithAccount('TARGET_ACCOUNT_ID')
          const product = new CloudFormationProduct(this, 'Product', {
            productName: 'SampleProduct',
            owner: 'OWNER',
            // We need to find a way to do CDK SYNTH of a stack, Store that in S3 and then use that as CF Template above to create a Portfolio
            productVersions: [
              {
                productVersionName: 'v1',
                cloudFormationTemplate: CloudFormationTemplate.fromProductStack(
                    new AmpMonitoringConstruct().create(scope, context.prodEnv1.account, context.prodEnv1.region),
                ),
              },
            ],
          })
          portfolio.setLocalLaunchRole(product, launchRole);

          
      
          portfolio.addProduct(product)

        // new cdk.CfnOutput(this, 'AMPTrustRole', { value: role ? role.roleArn : "none" });
    }
}