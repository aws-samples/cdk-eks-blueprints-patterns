# Security Best Practices for Amazon EKS

## Objective

The objective of this pattern is to demonstrate how to enable AWS Config Managed Rules for EKS Security Best Practices to your AWS account, verify that it is enabled, and get findings from Security Hub.

The pattern will enable Security Hub in the `CDK_DEFAULT_ACCOUNT` and `CDK_DEFAULT_REGION`, but only if it is not already enabled. If Security Hub is already enabled in the target AWS account and region the stack will fail and be rolled back.

## Prerequisites

1. Clone the repository.
2. Follow the usage [instructions](../../../README.md#usage) to install the dependencies.
3. `argo-admin-password` secret must be defined in Secrets Manager in the same region as the EKS cluster.

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

### Deploy AWS Config

Use the AWS Config setup blueprints pattern enable AWS Config in your account and region by running the following command.

```bash
make pattern eks-config-rules deploy eks-config-setup
```

### Deploy Config Rules for EKS Security Best Practices

Now enable the AWS Config managed rules for EKS security best practices by running the following command.

```bash
make pattern eks-config-rules deploy eks-config-rules-setup
```

## Verify

### Verify the status of the AWS Config managed rules for EKS security best practices

Using the following AWS CLI command, get a list Config rules with their evaluation status.

```bash
aws configservice describe-config-rule-evaluation-status
```

The output will look something like the following.

```json
{
    "ConfigRulesEvaluationStatus": [
        ...
        {
            "ConfigRuleName": "eks-config-rules-setup-EksEndpointNoPublicAccess49-37QJEXYZALLB",
            "ConfigRuleArn": "arn:aws:config:us-east-1:XXXXXXXXXXX:config-rule/config-rule-luqz0p",
            "ConfigRuleId": "config-rule-luqz0p",
            "LastSuccessfulInvocationTime": "2023-05-30T00:33:26.878000+00:00",
            "LastSuccessfulEvaluationTime": "2023-05-30T00:33:27.539000+00:00",
            "FirstActivatedTime": "2023-05-27T00:32:41.020000+00:00",
            "FirstEvaluationStarted": true
        },
        {
            "ConfigRuleName": "eks-config-rules-setup-EksOldestSupportedVersionAD-Z65N0TEQSF96",
            "ConfigRuleArn": "arn:aws:config:us-east-1:XXXXXXXXXXX:config-rule/config-rule-psbc54",
            "ConfigRuleId": "config-rule-psbc54",
            "LastSuccessfulInvocationTime": "2023-05-27T07:56:05.182000+00:00",
            "LastSuccessfulEvaluationTime": "2023-05-27T07:56:07.542000+00:00",
            "FirstActivatedTime": "2023-05-25T22:44:21.666000+00:00",
            "FirstEvaluationStarted": true
        },
        {
            "ConfigRuleName": "eks-config-rules-setup-EksSecretsEncrypted7566BFCD-HUQX4WXUDEFA",
            "ConfigRuleArn": "arn:aws:config:us-east-1:XXXXXXXXXXX:config-rule/config-rule-kzohng",
            "ConfigRuleId": "config-rule-kzohng",
            "LastSuccessfulInvocationTime": "2023-05-30T00:33:26.902000+00:00",
            "LastSuccessfulEvaluationTime": "2023-05-30T00:33:27.616000+00:00",
            "FirstActivatedTime": "2023-05-27T00:32:41.006000+00:00",
            "FirstEvaluationStarted": true
        },
        {
            "ConfigRuleName": "eks-config-rules-setup-EksSupportedVersionCDB3159A-1VNH10LGMMJX",
            "ConfigRuleArn": "arn:aws:config:us-east-1:XXXXXXXXXXX:config-rule/config-rule-oaio54",
            "ConfigRuleId": "config-rule-oaio54",
            "LastSuccessfulInvocationTime": "2023-05-27T07:56:05.223000+00:00",
            "LastSuccessfulEvaluationTime": "2023-05-27T07:56:05.420000+00:00",
            "FirstActivatedTime": "2023-05-25T22:51:26.563000+00:00",
            "FirstEvaluationStarted": true
        }
        ...
    ]
}
```

You can search for the EKS specific rules. Make a note of the unique `ConfigRuleName` of each of the Config rules for EKS security best practices.

Using the unique names of the EKS Config rules from **your account and region** shown after running the previous AWS CLI command, you can verify each EKS Config rule configuration and state using the following AWS CLI command (Remember to replace the rule names below with your rule names).

```bash
aws configservice describe-config-rules --config-rule-names "eks-config-rules-setup-EksEndpointNoPublicAccess<your rule id>" "eks-config-rules-setup-EksOldestSupportedVersion<your rule id>" "eks-config-rules-setup-EksSecretsEncrypted<your rule id>" "eks-config-rules-set
up-EksSupportedVersion<your rule id>"
```

```json
{
    "ConfigRules": [
        {
            "ConfigRuleName": "eks-config-rules-setup-EksEndpointNoPublicAccess49-37QJEXYZALLB",
            "ConfigRuleArn": "arn:aws:config:us-east-1:XXXXXXXXXXX:config-rule/config-rule-luqz0p",
            "ConfigRuleId": "config-rule-luqz0p",
            "Source": {
                "Owner": "AWS",
                "SourceIdentifier": "EKS_ENDPOINT_NO_PUBLIC_ACCESS"
            },
            "ConfigRuleState": "ACTIVE",
            "EvaluationModes": [
                {
                    "Mode": "DETECTIVE"
                }
            ]
        },
        {
            "ConfigRuleName": "eks-config-rules-setup-EksOldestSupportedVersionAD-Z65N0TEQSF96",
            "ConfigRuleArn": "arn:aws:config:us-east-1:XXXXXXXXXXX:config-rule/config-rule-psbc54",
            "ConfigRuleId": "config-rule-psbc54",
            "Source": {
                "Owner": "AWS",
                "SourceIdentifier": "EKS_CLUSTER_OLDEST_SUPPORTED_VERSION"
            },
            "InputParameters": "{\"oldestVersionSupported\":\"1.25\"}",
            "ConfigRuleState": "ACTIVE",
            "EvaluationModes": [
                {
                    "Mode": "DETECTIVE"
                }
            ]
        },
        {
            "ConfigRuleName": "eks-config-rules-setup-EksSecretsEncrypted7566BFCD-HUQX4WXUDEFA",
            "ConfigRuleArn": "arn:aws:config:us-east-1:XXXXXXXXXXX:config-rule/config-rule-kzohng",
            "ConfigRuleId": "config-rule-kzohng",
            "Source": {
                "Owner": "AWS",
                "SourceIdentifier": "EKS_SECRETS_ENCRYPTED"
            },
            "ConfigRuleState": "ACTIVE",
            "EvaluationModes": [
                {
                    "Mode": "DETECTIVE"
                }
            ]
        },
        {
            "ConfigRuleName": "eks-config-rules-setup-EksSupportedVersionCDB3159A-1VNH10LGMMJX",
            "ConfigRuleArn": "arn:aws:config:us-east-1:XXXXXXXXXXX:config-rule/config-rule-oaio54",
            "ConfigRuleId": "config-rule-oaio54",
            "Source": {
                "Owner": "AWS",
                "SourceIdentifier": "EKS_CLUSTER_SUPPORTED_VERSION"
            },
            "InputParameters": "{\"oldestVersionSupported\":\"1.25\"}",
            "ConfigRuleState": "ACTIVE",
            "EvaluationModes": [
                {
                    "Mode": "DETECTIVE"
                }
            ]
        }
    ]
}
```

Note that you can see the parameter value of the rules with required `InputParameters` (`EKS_CLUSTER_OLDEST_SUPPORTED_VERSION` and `EKS_CLUSTER_OLDEST_SUPPORTED_VERSION`), and the `ConfigRuleState` for each of the rules which is `ACTIVE`.
