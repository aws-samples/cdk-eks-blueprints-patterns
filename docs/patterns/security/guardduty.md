# Amazon GuardDuty protection

## Objective

The objective of this pattern is to demonstrate how to enable GuardDuty detector for an account, adjust data sources, and how to configure it to send findings to a SNS topic.

Supported optional data sources:

- [EKS Protection and Kubernetes audit logs](https://docs.aws.amazon.com/guardduty/latest/ug/kubernetes-protection.html)
- [Malware Protection](https://docs.aws.amazon.com/guardduty/latest/ug/malware-protection.html)
- [Amazon S3 Protection](https://docs.aws.amazon.com/guardduty/latest/ug/s3-protection.html)

To achieve this objective, the pattern utilizes [Nested Stack Add-on](https://aws-quickstart.github.io/cdk-eks-blueprints/addons/nested-stack/) to enable GuardDuty detector for the account. The pattern also created an SNS topic and a subscription to the topic to receive GuardDuty findings to the user-provided email address.

The list of optional data sources is adjustable via the `GuardDutySetupStack.builder` input in the pattern.

## Prerequisites

1. Clone the repository
1. Follow the usage [instructions](README.md#usage) to install the dependencies

## Deploying

To deploy the pattern, run the following command:

```bash
npx cdk deploy guardduty-blueprint
```

Now you can check that the GuardDuty detector is successfully enabled.

```bash
❯ aws guardduty list-detectors --region us-east-1

{
    "DetectorIds": [
        "84c3850c2f6f4224008aa9f0e2ee5448"
    ]
}

❯ aws guardduty get-detector --detector-id 84c3850c2f6f4224008aa9f0e2ee5448 --region us-east-1

{
    "CreatedAt": "2023-03-22T16:13:02.228Z",
    "FindingPublishingFrequency": "SIX_HOURS",
    "ServiceRole": "arn:aws:iam::123456789012:role/aws-service-role/guardduty.amazonaws.com/AWSServiceRoleForAmazonGuardDuty",
    "Status": "ENABLED",
    "UpdatedAt": "2023-03-22T16:13:02.228Z",
    "DataSources": {
        "CloudTrail": {
            "Status": "ENABLED"
        },
        "DNSLogs": {
            "Status": "ENABLED"
        },
        "FlowLogs": {
            "Status": "ENABLED"
        },
        "S3Logs": {
            "Status": "ENABLED"
        },
        "Kubernetes": {
            "AuditLogs": {
                "Status": "ENABLED"
            }
        },
        "MalwareProtection": {
            "ScanEc2InstanceWithFindings": {
                "EbsVolumes": {
                    "Status": "ENABLED"
                }
            },
            "ServiceRole": "arn:aws:iam::123456789012:role/aws-service-role/malware-protection.guardduty.amazonaws.com/AWSServiceRoleForAmazonGuardDutyMalwareProtection"
        }
    },
    "Tags": {}
 }
 ```
