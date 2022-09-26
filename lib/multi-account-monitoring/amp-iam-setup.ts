import { NestedStack, NestedStackProps } from 'aws-cdk-lib';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cdk from 'aws-cdk-lib';

/**
 * Stack the creates the role with trust relationship to the monitoring account to 
 * get AMP metrics.
 */
export class AmpIamSetupStack extends NestedStack {

    public static builder(roleName: string, trustAccount: string): blueprints.NestedStackBuilder {
        return {
            build(scope: Construct, id: string, props: NestedStackProps) {
                return new AmpIamSetupStack(scope, id, props, roleName, trustAccount);
            }
        };
    }

    constructor(scope: Construct, id: string, props: NestedStackProps, roleName: string, trustAccount: string) {
        super(scope, id, props);

        const role = new iam.Role(this, 'amp-iam-trust-role', {
            roleName: roleName,
            assumedBy: new iam.AccountPrincipal(trustAccount),
            description: 'AMP role to assume from central account',
        });

        role.addToPolicy(new iam.PolicyStatement({
            actions: [
                "aps:ListWorkspaces",
                "aps:DescribeWorkspace",
                "aps:QueryMetrics",
                "aps:GetLabels",
                "aps:GetSeries",
                "aps:GetMetricMetadata",
                "xray:PutTraceSegments",
                "xray:PutTelemetryRecords",
                "xray:GetSamplingRules",
                "xray:GetSamplingTargets",
                "xray:GetSamplingStatisticSummaries",
                "xray:BatchGetTraces",
                "xray:GetServiceGraph",
                "xray:GetTraceGraph",
                "xray:GetTraceSummaries",
                "xray:GetGroups",
                "xray:GetGroup",
                "xray:ListTagsForResource",
                "xray:GetTimeSeriesServiceStatistics",
                "xray:GetInsightSummaries",
                "xray:GetInsight",
                "xray:GetInsightEvents",
                "xray:GetInsightImpactGraph",
                "ssm:GetParameter"
            ],
            resources: ["*"],
        }));

        new cdk.CfnOutput(this, 'AMPTrustRole', { value: role ? role.roleArn : "none" });
    }
}