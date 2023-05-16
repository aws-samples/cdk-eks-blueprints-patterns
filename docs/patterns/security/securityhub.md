# AWS Security Hub Monitoring

## Objective

The objective of this pattern is to demonstrate how to enable Security Hub in your AWS account, verify that it is enabled, and get findings from Security Hub.

The pattern will enable Security Hub in the `CDKCDK_DEFAULT_ACCOUNT` and `CDK_DEFAULT_REGION`, but only if it is not already enabled. If Security Hub is already enabled in the target AWS account and region the stack will fail and be rolled back.

## Prerequisites

1. Clone the repository
1. Follow the usage [instructions](README.md#usage) to install the dependencies
1. `argo-admin-password` secret must be defined in Secrets Manager in the same region as the EKS cluster.

## Deploy

To deploy the stack, run the following command:

```bash
npx cdk deploy securityhub-setup
```

## Verify

### Verifying that Security Hub is enabled

Now you can check that the is successfully enabled in the by using the aws CLI to query the same account and region.

Using the aws CLI run following command in the same account and region where you deployed the stack:

```bash
aws securityhub describe-hub
```

The output should look like this:

```json
{
    "HubArn": "arn:aws:securityhub:us-east-1:XXXXXXXXXXXX:hub/default",
    "SubscribedAt": "2021-08-18T00:52:40.624Z",
    "AutoEnableControls": true
}
```

### View Critical and Failed Security Standards Controls findings 

To list the critical and faild security standards controls findings in the same account and region, run the following command:

```bash
aws securityhub get-findings --filter 'SeverityLabel={Value=CRITICAL,Comparison=EQUALS},ComplianceStatus={Value=FAILED,Comparison=EQUALS}'
```

The output should look like this:

```json
{
    "FindingIds": [
        "f2c3859c6ca25b3057d13470a992bbd7"
    ]
}
```

To check the finding's details, run the following command (please replace `<DETECTOR-ID>` and `<FINDING-ID>` with the ID of the detector and the ID of the finding):

```bash
aws guardduty get-findings --detector-id <DETECTOR-ID> --finding-ids <FINDING-ID> --region us-east-1
```

The list of findings contains `PrivilegeEscalation:Kubernetes/PrivilegedContainer` as expected:

```json
{
    "Findings": [
        {
            "SchemaVersion": "2018-10-08",
            "Id": "arn:aws:securityhub:us-east-1:XXXXXXXXXXX:security-control/IAM.9/finding/8c624a5f-af58-43d1-a955-d9c28d82ce53",
            "ProductArn": "arn:aws:securityhub:us-east-1::product/aws/securityhub",
            "ProductName": "Security Hub",
            "CompanyName": "AWS",
            "Region": "us-east-1",
            "GeneratorId": "security-control/IAM.9",
            "AwsAccountId": "XXXXXXXXXXX",
            "Types": [
                "Software and Configuration Checks/Industry and Regulatory Standards"
            ],
            "FirstObservedAt": "2023-05-16T00:47:53.341Z",
            "LastObservedAt": "2023-05-16T00:48:03.373Z",
            "CreatedAt": "2023-05-16T00:47:53.341Z",
            "UpdatedAt": "2023-05-16T00:47:53.341Z",
            "Severity": {
                "Label": "CRITICAL",
                "Normalized": 90,
                "Original": "CRITICAL"
            },
            "Title": "Virtual MFA should be enabled for the root user",
            "Description": "This AWS control checks whether users of your AWS account require a multi-factor authentication (MFA) device to sign in with root user credentials.",
            "Remediation": {
                "Recommendation": {
                    "Text": "For information on how to correct this issue, consult the AWS Security Hub controls documentation.",
                    "Url": "https://docs.aws.amazon.com/console/securityhub/IAM.9/remediation"
                }
            },
            "ProductFields": {
                "RelatedAWSResources:0/name": "securityhub-root-account-mfa-enabled-4109eab4",
                "RelatedAWSResources:0/type": "AWS::Config::ConfigRule",
                "aws/securityhub/ProductName": "Security Hub",
                "aws/securityhub/CompanyName": "AWS",
                "Resources:0/Id": "arn:aws:iam::XXXXXXXXXXX:root",
                "aws/securityhub/FindingId": "arn:aws:securityhub:us-east-1::product/aws/securityhub/arn:aws:securityhub:us-east-1:XXXXXXXXXXX:security-control/IAM.9/finding/8c624a5f-af58-43d1-a955-d9c28d82ce53"
            },
            "Resources": [
                {
                    "Type": "AwsAccount",
                    "Id": "AWS::::Account:XXXXXXXXXXX",
                    "Partition": "aws",
                    "Region": "us-east-1"
                }
            ],
            "Compliance": {
                "Status": "FAILED",
                "RelatedRequirements": [
                    "CIS AWS Foundations Benchmark v1.2.0/1.13"
                ],
                "SecurityControlId": "IAM.9",
                "AssociatedStandards": [
                    {
                        "StandardsId": "ruleset/cis-aws-foundations-benchmark/v/1.2.0"
                    }
                ]
            },
            "WorkflowState": "NEW",
            "Workflow": {
                "Status": "NEW"
            },
            "RecordState": "ACTIVE",
            "FindingProviderFields": {
                "Severity": {
                    "Label": "CRITICAL",
                    "Original": "CRITICAL"
                },
                "Types": [
                    "Software and Configuration Checks/Industry and Regulatory Standards"
                ]
            }
        },
        {
            "SchemaVersion": "2018-10-08",
            "Id": "arn:aws:securityhub:us-east-1:XXXXXXXXXXX:security-control/IAM.6/finding/fc59f938-14be-4ee8-b91c-fb1ab510c243",
            "ProductArn": "arn:aws:securityhub:us-east-1::product/aws/securityhub",
            "ProductName": "Security Hub",
            "CompanyName": "AWS",
            "Region": "us-east-1",
            "GeneratorId": "security-control/IAM.6",
            "AwsAccountId": "XXXXXXXXXXX",
            "Types": [
                "Software and Configuration Checks/Industry and Regulatory Standards"
            ],
            "FirstObservedAt": "2023-05-16T00:47:47.321Z",
            "LastObservedAt": "2023-05-16T00:47:58.460Z",
            "CreatedAt": "2023-05-16T00:47:47.321Z",
            "UpdatedAt": "2023-05-16T00:47:47.321Z",
            "Severity": {
                "Label": "CRITICAL",
                "Normalized": 90,
                "Original": "CRITICAL"
            },
            "Title": "Hardware MFA should be enabled for the root user",
            "Description": "This AWS control checks whether your AWS account is enabled to use a hardware multi-factor authentication (MFA) device to sign in with root user credentials.",
            "Remediation": {
                "Recommendation": {
                    "Text": "For information on how to correct this issue, consult the AWS Security Hub controls documentation.",
                    "Url": "https://docs.aws.amazon.com/console/securityhub/IAM.6/remediation"
                }
            },
            "ProductFields": {
                "RelatedAWSResources:0/name": "securityhub-root-account-hardware-mfa-enabled-c303ea05",
                "RelatedAWSResources:0/type": "AWS::Config::ConfigRule",
                "aws/securityhub/ProductName": "Security Hub",
                "aws/securityhub/CompanyName": "AWS",
                "Resources:0/Id": "arn:aws:iam::XXXXXXXXXXX:root",
                "aws/securityhub/FindingId": "arn:aws:securityhub:us-east-1::product/aws/securityhub/arn:aws:securityhub:us-east-1:XXXXXXXXXXX:security-control/IAM.6/finding/fc59f938-14be-4ee8-b91c-fb1ab510c243"
            },
            "Resources": [
                {
                    "Type": "AwsAccount",
                    "Id": "AWS::::Account:XXXXXXXXXXX",
                    "Partition": "aws",
                    "Region": "us-east-1"
                }
            ],
            "Compliance": {
                "Status": "FAILED",
                "RelatedRequirements": [
                    "CIS AWS Foundations Benchmark v1.2.0/1.14"
                ],
                "SecurityControlId": "IAM.6",
                "AssociatedStandards": [
                    {
                        "StandardsId": "ruleset/cis-aws-foundations-benchmark/v/1.2.0"
                    },
                    {
                        "StandardsId": "standards/aws-foundational-security-best-practices/v/1.0.0"
                    }
                ]
            },
            "WorkflowState": "NEW",
            "Workflow": {
                "Status": "NEW"
            },
            "RecordState": "ACTIVE",
            "FindingProviderFields": {
                "Severity": {
                    "Label": "CRITICAL",
                    "Original": "CRITICAL"
                },
                "Types": [
                    "Software and Configuration Checks/Industry and Regulatory Standards"
                ]
            }
        }
    ]
}
```
