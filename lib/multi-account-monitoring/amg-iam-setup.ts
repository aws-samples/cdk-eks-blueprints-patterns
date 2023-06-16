import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cdk from 'aws-cdk-lib';

/**
 * Defines properties for the AMG IAM setup. 
 */
export interface AmgIamSetupStackProps extends cdk.StackProps {
    /**
     * Role to create for the AMG stack that grants access to the specified accounts for AMP and CloudWatch metrics.
     */
    roleName: string,

    /**
     * Monitored accounts. These contain ampPrometheusDataSourceRole and cloudwatchPrometheusDataSourceRole roles 
     * with trust relationship to the monitoring (AMG) account.
     */
    accounts: string[]
} 

/**
 * Stack provisions IAM in the moniitoring account with turst relationship to the monitored account for metrics. 
 */
export class AmgIamSetupStack extends cdk.Stack {
  
    constructor(scope: Construct, id: string, props: AmgIamSetupStackProps) {
        super(scope, id, props);

        const role = new iam.Role(this, 'amg-iam-role', {
            roleName: props.roleName,
            assumedBy: new iam.ServicePrincipal('grafana.amazonaws.com'),
            description: 'Service Role for Amazon Managed Grafana',
        });
        
        for (let i = 0; i < props.accounts.length; i++) {
            role.addToPolicy(new iam.PolicyStatement({
                actions: [
                    "sts:AssumeRole"
                ],
                resources: [`arn:aws:iam::${props.accounts[i]}:role/ampPrometheusDataSourceRole`,
                    `arn:aws:iam::${props.accounts[i]}:role/cloudwatchDataSourceRole`
                ],
            }));
        }

        new cdk.CfnOutput(this, 'AMGRole', { value: role ? role.roleArn : "none" });
    }
}