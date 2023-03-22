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
