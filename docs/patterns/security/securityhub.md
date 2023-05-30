# AWS Security Hub Monitoring

## Objective

The objective of this pattern is to demonstrate how to enable Security Hub in your AWS account, verify that it is enabled, and get findings from Security Hub.

The pattern will enable Security Hub in the `CDK_DEFAULT_ACCOUNT` and `CDK_DEFAULT_REGION`, but only if it is not already enabled. If Security Hub is already enabled in the target AWS account and region the stack will fail and be rolled back.

## Prerequisites

1. Clone the repository
1. Follow the usage [instructions](README.md#usage) to install the dependencies
1. `argo-admin-password` secret must be defined in Secrets Manager in the same region as the EKS cluster.

**Optional (but recommended):**  If you have not done so already, follow the steps to deploy the [GuardDuty stack and blueprint](guardduty.md). Since GuardDuty automatically sends its findings to Security Hub, the sample EKS finding will appear in Security Hub about five minutes after it has been enabled in the same region.

## Deploy

To enable Security Hub in the account and region deploy the stack, run the following command.

```bash
make pattern securityhub deploy securityhub-setup
```

Once deployed, AWS Security Hub will automatically enable the [AWS Foundational Security Best Practices standard](https://docs.aws.amazon.com/securityhub/latest/userguide/fsbp-standard.html) and the [Center for Internet Security (CIS) AWS Foundations Benchmark v1.2.0](https://docs.aws.amazon.com/securityhub/latest/userguide/cis-aws-foundations-benchmark.html) security standard controls status checks.

To increase your EKS security posture awareness, deploy the [Security Best Practices for Amazon EKS](eks-config-rules.md) Cofing managed rules. The compliance status of each of these EKS configuration checks by AWS Config will be sent to Security Hub as findings.

## Verify

### Verifying that Security Hub is enabled

Now you can check that the is successfully enabled in the by using the aws CLI to query the same account and region.

Using the aws CLI run following command in the same account and region where you deployed the stack.

```bash
aws securityhub describe-hub
```

If you successfully enabled Security Hub, you will see the following.

```json
{
    "HubArn": "arn:aws:securityhub:us-east-1:XXXXXXXXXXXX:hub/default",
    "SubscribedAt": "2021-08-18T00:52:40.624Z",
    "AutoEnableControls": true
}
```

### View Critical and Failed Security Standards Controls findings

To list any critical findings, and findings related to controls that have a failed status according to [Security Hub security standards](https://docs.aws.amazon.com/securityhub/latest/userguide/securityhub-standards.html) which are enabled in the same account and region, run the following command.

```bash
aws securityhub get-findings
```

The findings that you see will depend what you have configured in your account and region. In this example we deployed the [GuardDuty EKS blueprint](guardduty.md), the [Security Best Practices for Amazon EKS](eks-config-rules.md) Cofing managed rules, and successfully enabled Security Hub using the instructions above which automatcially enables some Security Hub Security standards. The following is an example of findings that this produced.

```json
{
    "Findings": [
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
            ...
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
               ... 
            },
            "Resources": [
                {  ...  }
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
            ...
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
            "Id": "arn:aws:securityhub:us-east-1:XXXXXXXXXXX:security-control/EKS.1/finding/cbb429cf-6fac-4cfc-9a62-d11eed3b367d",
            "ProductArn": "arn:aws:securityhub:us-east-1::product/aws/securityhub",
            "ProductName": "Security Hub",
            "CompanyName": "AWS",
            "Region": "us-east-1",
            "GeneratorId": "security-control/EKS.1",
            "AwsAccountId": "XXXXXXXXXXX",
            "Types": [
                "Software and Configuration Checks/Industry and Regulatory Standards"
            ],
            ...
            "Severity": {
                "Label": "HIGH",
                "Normalized": 70,
                "Original": "HIGH"
            },
            "Title": "EKS cluster endpoints should not be publicly accessible",
            "Description": "This control checks whether an Amazon EKS cluster endpoint is publicly accessible. The control fails if an EKS cluster has an endpoint that is publicly accessible.",
            "Remediation": {
                "Recommendation": {
                    "Text": "For information on how to correct this issue, consult the AWS Security Hub controls documentation.",
                    "Url": "https://docs.aws.amazon.com/console/securityhub/EKS.1/remediation"
                }
            },
            "ProductFields": {
                ...
            },
            "Resources": [
                {
                    ...
                }
            ],
            "Compliance": {
                "Status": "FAILED",
                "SecurityControlId": "EKS.1",
                "AssociatedStandards": [
                    {
                        "StandardsId": "standards/aws-foundational-security-best-practices/v/1.0.0"
                    }
                ]
            },
            ...
            "RecordState": "ARCHIVED",
            "FindingProviderFields": {
                "Severity": {
                    "Label": "HIGH",
                    "Original": "HIGH"
                },
                "Types": [
                    "Software and Configuration Checks/Industry and Regulatory Standards"
                ]
            }
        },
        {
            "SchemaVersion": "2018-10-08",
            "Id": "arn:aws:guardduty:us-east-1:XXXXXXXXXXX:detector/68b6db88cfef1e59333ecbccd8e816b5/finding/0ec437473c147f649d1437f94d615224",
            "ProductArn": "arn:aws:securityhub:us-east-1::product/aws/guardduty",
            "ProductName": "GuardDuty",
            "CompanyName": "Amazon",
            "Region": "us-east-1",
            "GeneratorId": "arn:aws:guardduty:us-east-1:XXXXXXXXXXX:detector/68b6db88cfef1e59333ecbccd8e816b5",
            "AwsAccountId": "XXXXXXXXXXX",
            "Types": [
                "TTPs/PrivilegeEscalation/PrivilegeEscalation:Kubernetes-PrivilegedContainer"
            ],
            ...
            "Severity": {
                "Product": 5,
                "Label": "MEDIUM",
                "Normalized": 50
            },
            "Title": "Privileged container with root level access launched on the EKS Cluster.",
            "Description": "A privileged container with root level access was launched on EKS Cluster guardduty-blueprint. If this behavior is not expected, it may indicate that your credentials are compromised.",
            "SourceUrl": "https://us-east-1.console.aws.amazon.com/guardduty/home?region=us-east-1#/findings?macros=current&fId=0ec437473c147f649d1437f94d615224",
            "ProductFields": {
                ...
            },
            "Resources": [
                { ... }
            ],
            "WorkflowState": "NEW",
            "Workflow": {
                "Status": "NEW"
            },
            "RecordState": "ACTIVE",
            "FindingProviderFields": {
                "Severity": {
                    "Label": "MEDIUM"
                },
                "Types": [
                    "TTPs/PrivilegeEscalation/PrivilegeEscalation:Kubernetes-PrivilegedContainer"
                ]
            },
            "Sample": false
        }
    ]
}
```

If you deployed the [Amazon GuardDuty Protection EKS Blueprints pattern](https://github.com/aws-samples/cdk-eks-blueprints-patterns/blob/main/docs/patterns/security/guardduty.md) to the same account and region where you enabled Security Hub you should see a GuardDuty related finding like the last one in the above json list. The sample workload deployed with the [GuardDuty pattern](guardduty.md) which contains a privileged container is detected by GuardDuty which generates the `Kubernetes-PrivilegedContainer` finding and it is automatically sent to Security Hub where it can be viewed and triaged alongside other findings from different sources.
