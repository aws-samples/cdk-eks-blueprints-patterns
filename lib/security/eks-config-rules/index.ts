import * as exampleClusterProvider from "@aws-quickstart/eks-blueprints/dist/cluster-providers";
import * as config from "aws-cdk-lib/aws-config";
import { Construct } from "constructs";
import { Stack, StackProps } from "aws-cdk-lib";


// Enable the AWS Config Managed Rules for EKS Security Best Pratices
export class EksConfigRulesSetup extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // Get the default kubernetes version used by the CDK EKS Blueprints framework.
        const defaultKubVerison =
      exampleClusterProvider.defaultOptions.version.version;

        // Checks if an Amazon Elastic Kubernetes Service (EKS) cluster is running a supported Kubernetes version.
        new config.ManagedRule(this, "EksOldestSupportedVersion", {
            identifier:
        config.ManagedRuleIdentifiers.EKS_CLUSTER_OLDEST_SUPPORTED_VERSION,
            inputParameters: {
                oldestVersionSupported: defaultKubVerison, // Set to the default cluster version used by CDK EKS Blueprints.
            },
        });

        // Checks whether Amazon Elastic Kubernetes Service (Amazon EKS) endpoint is not publicly accessible.
        new config.ManagedRule(this, "EksSupportedVersion", {
            identifier: config.ManagedRuleIdentifiers.EKS_CLUSTER_SUPPORTED_VERSION,
            inputParameters: {
                oldestVersionSupported: defaultKubVerison, //  Set to the default cluster version used by CDK EKS Blueprints.
            },
        });

        // Checks whether Amazon Elastic Kubernetes Service (Amazon EKS) endpoint is not publicly accessible.
        new config.ManagedRule(this, "EksEndpointNoPublicAccess", {
            identifier: config.ManagedRuleIdentifiers.EKS_ENDPOINT_NO_PUBLIC_ACCESS,
        });

        // Checks whether Amazon Elastic Kubernetes Service clusters are configured to have Kubernetes secrets encrypted using AWS Key Management Service (KMS) keys.
        new config.ManagedRule(this, "EksSecretsEncrypted", {
            identifier: config.ManagedRuleIdentifiers.EKS_SECRETS_ENCRYPTED,
        });
    }
}
