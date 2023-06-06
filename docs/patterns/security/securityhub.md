# AWS Security Hub Monitoring

## Objective

The objective of this pattern is to demonstrate how to enable Security Hub in your AWS account, verify that it is enabled, and get findings from Security Hub.

The pattern will enable Security Hub in the `CDK_DEFAULT_ACCOUNT` and `CDK_DEFAULT_REGION`.

## Prerequisites

1. Clone the repository
2. Follow the usage [instructions](../../../README.md#usage) to install the dependencies
3. `argo-admin-password` secret must be defined in Secrets Manager in the same region as the EKS cluster.
4. Complete the steps to [enable AWS Config and deploy the Security Best Practices for Amazon EKS AWS Config managed rules](eks-config-rules.md).

**Optional (but recommended):**  If you have not done so already, follow the steps to deploy the [GuardDuty stack and blueprint](guardduty.md). Since GuardDuty automatically sends its findings to Security Hub, the sample EKS finding will appear in Security Hub about five minutes after it has been enabled in the same region.

## Deploy

To update npm, run the following command:

```bash
npm install -g npm@latest
```

To bootstrap the CDK toolkit and list all stacks in the app, run the following commands:

```bash
cdk bootstrap
make list
```

### Deploy AWS Security Hub

To enable Security Hub in the account and region deploy the stack, run the following command.

```bash
make pattern securityhub deploy securityhub-setup
```

Once deployed, AWS Security Hub will automatically enable the [AWS Foundational Security Best Practices standard](https://docs.aws.amazon.com/securityhub/latest/userguide/fsbp-standard.html) and the [Center for Internet Security (CIS) AWS Foundations Benchmark v1.2.0](https://docs.aws.amazon.com/securityhub/latest/userguide/cis-aws-foundations-benchmark.html) security standard controls status checks.

## Verify

### Verify that Security Hub is enabled

Now you can check that Security Hub is successfully enabled by using the AWS CLI to query the same account and region.

Using the AWS CLI run following command in the same account and region where you deployed the stack.

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

### View findings in Security Hub

The findings that you see in Security Hub will depend what you have configured in your account and region. In this example we deployed the [GuardDuty EKS pattern](guardduty.md), the [Security Best Practices for Amazon EKS Config managed rules pattern](eks-config-rules.md), and successfully enabled Security Hub using the instructions above, which automatically enables two of the available Security Hub Security standard controls status checks.

Use the following AWS CLI commands to view your findings in Security Hub.

To list any critical findings, and findings related to controls that have a failed status according to [Security Hub security standards](https://docs.aws.amazon.com/securityhub/latest/userguide/securityhub-standards.html) which are enabled in the same account and region, run the following command.

```bash
aws securityhub get-findings --filter 'SeverityLabel={Value=CRITICAL,Comparison=EQUALS},ComplianceStatus={Value=FAILED,Comparison=EQUALS}'
```

The following is an example of an IAM finding that relates to a [failed IAM control](https://docs.aws.amazon.com/securityhub/latest/userguide/iam-controls.html#iam-6) that Security Hub found related to the enabled [Security standards](https://docs.aws.amazon.com/securityhub/latest/userguide/standards-reference.html), and will likely be present in your list of findings if you or your organization are not using a hardware MFA device for your AWS root account.

```json
{
    "Findings": [
        {
            "SchemaVersion": "2018-10-08",
            "Id": "arn:aws:securityhub:us-east-1:XXXXXXXXXXX:security-control/IAM.6/finding/494ffa38-0b6e-46d1-98f4-e605ec09d045",
            "ProductArn": "arn:aws:securityhub:us-east-1::product/aws/securityhub",
            "ProductName": "Security Hub",
            "CompanyName": "AWS",
            "Region": "us-east-1",
            "GeneratorId": "security-control/IAM.6",
            "AwsAccountId": "XXXXXXXXXXX",
            "Types": [
                "Software and Configuration Checks/Industry and Regulatory Standards"
            ],
            "FirstObservedAt": "2023-03-04T00:54:44.307Z",
            "LastObservedAt": "2023-05-31T01:20:18.210Z",
            "CreatedAt": "2023-03-04T00:54:44.307Z",
            "UpdatedAt": "2023-05-31T01:20:05.845Z",
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
                "RelatedAWSResources:0/name": "securityhub-root-account-hardware-mfa-enabled-24e3b344",
                "RelatedAWSResources:0/type": "AWS::Config::ConfigRule",
                "aws/securityhub/ProductName": "Security Hub",
                "aws/securityhub/CompanyName": "AWS",
                "Resources:0/Id": "arn:aws:iam::XXXXXXXXXXX:root",
                "aws/securityhub/FindingId": "arn:aws:securityhub:us-east-1::product/aws/securityhub/arn:aws:securityhub:us-east-1:XXXXXXXXXXX:security-control/IAM.6/finding/494ffa38-0b6e-46d1-98f4-e605ec09d045"
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
                    "CIS AWS Foundations Benchmark v1.2.0/1.14",
                    "CIS AWS Foundations Benchmark v1.4.0/1.6",
                    "NIST.800-53.r5 AC-2(1)",
                    "NIST.800-53.r5 AC-3(15)",
                    "NIST.800-53.r5 IA-2(1)",
                    "NIST.800-53.r5 IA-2(2)",
                    "NIST.800-53.r5 IA-2(6)",
                    "NIST.800-53.r5 IA-2(8)",
                    "PCI DSS v3.2.1/8.3.1"
                ],
                "SecurityControlId": "IAM.6",
                "AssociatedStandards": [
                    {
                        "StandardsId": "ruleset/cis-aws-foundations-benchmark/v/1.2.0"
                    },
                    {
                        "StandardsId": "standards/aws-foundational-security-best-practices/v/1.0.0"
                    },
                    {
                        "StandardsId": "standards/cis-aws-foundations-benchmark/v/1.4.0"
                    },
                    {
                        "StandardsId": "standards/nist-800-53/v/5.0.0"
                    },
                    {
                        "StandardsId": "standards/pci-dss/v/3.2.1"
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

Now search for a finding related to the Security Best Practices for Amazon EKS Config managed rules, run the following AWS CLI command.

```bash
aws securityhub get-findings --filters 'GeneratorId={Value="security-control/EKS.1", Comparison="EQUALS"}'
```

You might see a finding such as the following.

```json
{
    "Findings": [
        {
            "SchemaVersion": "2018-10-08",
            "Id": "arn:aws:securityhub:us-east-1:XXXXXXXXXXX:security-control/EKS.1/finding/931a06d9-1b1d-431b-8b91-1ff86829b400",
            "ProductArn": "arn:aws:securityhub:us-east-1::product/aws/securityhub",
            "ProductName": "Security Hub",
            "CompanyName": "AWS",
            "Region": "us-east-1",
            "GeneratorId": "security-control/EKS.1",
            "AwsAccountId": "XXXXXXXXXXX",
            "Types": [
                "Software and Configuration Checks/Industry and Regulatory Standards"
            ],
            "FirstObservedAt": "2023-05-09T10:34:36.736Z",
            "LastObservedAt": "2023-05-30T10:27:41.205Z",
            "CreatedAt": "2023-05-09T10:34:36.736Z",
            "UpdatedAt": "2023-05-30T10:27:34.574Z",
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
                "RelatedAWSResources:0/name": "securityhub-eks-endpoint-no-public-access-f5aecad6",
                "RelatedAWSResources:0/type": "AWS::Config::ConfigRule",
                "aws/securityhub/ProductName": "Security Hub",
                "aws/securityhub/CompanyName": "AWS",
                "aws/securityhub/annotation": "Cluster Endpoint of starter-blueprint is Publicly accessible",
                "Resources:0/Id": "arn:aws:eks:us-east-1:XXXXXXXXXXX:cluster/starter-blueprint",
                "aws/securityhub/FindingId": "arn:aws:securityhub:us-east-1::product/aws/securityhub/arn:aws:securityhub:us-east-1:XXXXXXXXXXX:security-control/EKS.1/finding/931a06d9-1b1d-431b-8b91-1ff86829b400"
            },
            "Resources": [
                {
                    "Type": "AwsEksCluster",
                    "Id": "arn:aws:eks:us-east-1:XXXXXXXXXXX:cluster/starter-blueprint",
                    "Partition": "aws",
                    "Region": "us-east-1"
                }
            ],
            "Compliance": {
                "Status": "FAILED",
                "RelatedRequirements": [
                    "NIST.800-53.r5 AC-21",
                    "NIST.800-53.r5 AC-3",
                    "NIST.800-53.r5 AC-3(7)",
                    "NIST.800-53.r5 AC-4",
                    "NIST.800-53.r5 AC-4(21)",
                    "NIST.800-53.r5 AC-6",
                    "NIST.800-53.r5 SC-7",
                    "NIST.800-53.r5 SC-7(11)",
                    "NIST.800-53.r5 SC-7(16)",
                    "NIST.800-53.r5 SC-7(20)",
                    "NIST.800-53.r5 SC-7(21)",
                    "NIST.800-53.r5 SC-7(3)",
                    "NIST.800-53.r5 SC-7(4)",
                    "NIST.800-53.r5 SC-7(9)"
                ],
                "SecurityControlId": "EKS.1",
                "AssociatedStandards": [
                    {
                        "StandardsId": "standards/aws-foundational-security-best-practices/v/1.0.0"
                    },
                    {
                        "StandardsId": "standards/nist-800-53/v/5.0.0"
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
                    "Label": "HIGH",
                    "Original": "HIGH"
                },
                "Types": [
                    "Software and Configuration Checks/Industry and Regulatory Standards"
                ]
            }
        }
        
    ]
}
```

To see any findings generated by GuardDuty in Security Hub, run the following command.

```bash
aws securityhub get-findings --filters 'ProductName={Value="GuardDuty",Comparison="EQUALS"}'
```

```json
{
    "Findings": [
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

If you deployed the [Amazon GuardDuty Protection EKS Blueprints pattern](https://github.com/aws-samples/cdk-eks-blueprints-patterns/blob/main/docs/patterns/security/guardduty.md) to the same account and region where you enabled Security Hub you should see a GuardDuty finding like the one above. The sample workload deployed with the [GuardDuty pattern](guardduty.md) which contains a privileged container is detected by GuardDuty and generates the `Kubernetes-PrivilegedContainer` finding. GuardDuty automatically sent this finding to Security Hub where it can be viewed and triaged.
