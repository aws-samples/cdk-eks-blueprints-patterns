import * as securityhub from 'aws-cdk-lib/aws-securityhub';
import { Construct } from "constructs";
import { Stack, StackProps } from "aws-cdk-lib";

export class SecurityHubStackSetup extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // Enable Security Hub
        new securityhub.CfnHub(this, 'MyCfnHub');
    }
}