import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cdk from 'aws-cdk-lib';

export interface AmgIamSetupStackProps extends cdk.StackProps {
    roleName: string,
    accounts: string[]
} 

export class AmgIamSetupStack extends cdk.Stack {
  
    constructor(scope: Construct, id: string, props: AmgIamSetupStackProps) {
        super(scope, id, props);

        const role = new iam.Role(this, 'amg-iam-role', {
            roleName: props.roleName,
            assumedBy: new iam.ServicePrincipal('grafana.amazonaws.com'),
            description: 'Service Role for Amazon Managed Grafana',
        });
        
        for (var i = 0; i < props.accounts.length; i++) {
            role.addToPolicy(new iam.PolicyStatement({
                actions: [
                    "sts:AssumeRole"
                ],
                resources: [`arn:aws:iam::${props.accounts[i]}:role/ampPrometheusDataSourceRole`,
                            `arn:aws:iam::${props.accounts[i]}:role/cloudwatchPrometheusDataSourceRole`
                ],
            }));
        }

        new cdk.CfnOutput(this, 'AMGRole', { value: role ? role.roleArn : "none" });
    }
}