import { Stack } from "aws-cdk-lib";
import { NagSuppressions } from "cdk-nag";


export class NagSuppressionsConfig {
    constructor(stack: Stack) {

        NagSuppressions.addResourceSuppressions(stack, [
            {
                id: 'AwsSolutions-SF1',
                reason: 'The Step Function does not log "ALL" events to CloudWatch Logs. - Step functions are native CDK functionality, not part of blueprints.',
            },
            {
                id: 'AwsSolutions-SF2',
                reason: 'The Step Function does not have X-Ray tracing enabled. - Step functions are native CDK functionality, not part of blueprints.',
            },
        ]);

        NagSuppressions.addResourceSuppressionsByPath(
            stack,
            `/${stack.stackName}/${stack.stackName}/KubectlHandlerRole/Resource`, [
            {
                id: 'AwsSolutions-IAM4',
                reason: 'Managed IAM policies make sense in the context of Lambda functions for basic execution',
            },
        ]);

        NagSuppressions.addResourceSuppressionsByPath(
            stack,
            `/${stack.stackName}/${stack.stackName}/KubectlHandlerRole/DefaultPolicy/Resource`, [
            {
                id: 'AwsSolutions-IAM5',
                reason: 'Wildcards in IAM policy are recommended for read/write',
            },
        ]);

        NagSuppressions.addResourceSuppressionsByPath(
            stack,
            `/${stack.stackName}/${stack.stackName}/Role/Resource`, [
            {
                id: 'AwsSolutions-IAM4',
                reason: 'EKS cluster default role should use AWS managed IAM policy',
            },
        ]);

        NagSuppressions.addResourceSuppressionsByPath(
            stack,
            `/${stack.stackName}/${stack.stackName}/Resource/CreationRole/DefaultPolicy/Resource`, [
            {
                id: 'AwsSolutions-IAM5',
                reason: 'Remediation ticket raised https://app.gitlab.gss.gov.uk/north/t-p/cloud-hub/cloud-adoption-engineering-patterns/products/eksaap/eks-as-a-pattern/-/issues/129',
            },
        ]);

        NagSuppressions.addResourceSuppressionsByPath(
            stack,
            `/${stack.stackName}/${stack.stackName}/Resource/Resource/Default`, [
            {
                id: 'AwsSolutions-EKS2',
                reason: 'Remediation ticket raised https://app.gitlab.gss.gov.uk/north/t-p/cloud-hub/cloud-adoption-engineering-patterns/products/eksaap/eks-as-a-pattern/-/issues/130',
            },
        ]);

        NagSuppressions.addResourceSuppressionsByPath(
            stack,
            `/${stack.stackName}/${stack.stackName}/aws-ebs-csi-driver-managed-policy/Resource`, [
            {
                id: 'AwsSolutions-IAM5',
                reason: 'Remediation ticket raised https://app.gitlab.gss.gov.uk/north/t-p/cloud-hub/cloud-adoption-engineering-patterns/products/eksaap/eks-as-a-pattern/-/issues/132',
            },
        ]);

        NagSuppressions.addResourceSuppressionsByPath(
            stack,
            `/${stack.stackName}/@aws-cdk--aws-eks.ClusterResourceProvider/OnEventHandler/ServiceRole/Resource`, [
            {
                id: 'AwsSolutions-IAM4',
                reason: 'This is the basic lambda execution role, that is ok',
            },
        ]);

        NagSuppressions.addResourceSuppressionsByPath(
            stack,
            `/${stack.stackName}/@aws-cdk--aws-eks.ClusterResourceProvider/OnEventHandler/Resource`, [
            {
                id: 'AwsSolutions-L1',
                reason: 'This is packaged as a core part of Blueprints, will be updated as part of their release schedule. Currently on a supported NodeJS verison (18)',
            },
        ]);

        NagSuppressions.addResourceSuppressionsByPath(
            stack,
            `/${stack.stackName}/@aws-cdk--aws-eks.ClusterResourceProvider/IsCompleteHandler/ServiceRole/Resource`, [
            {
                id: 'AwsSolutions-IAM4',
                reason: 'This is the basic lambda execution role, that is ok',
            },
        ]);

        NagSuppressions.addResourceSuppressionsByPath(
            stack,
            `/${stack.stackName}/@aws-cdk--aws-eks.ClusterResourceProvider/IsCompleteHandler/Resource`, [
            {
                id: 'AwsSolutions-L1',
                reason: 'This is packaged as a core part of Blueprints, will be updated as part of their release schedule. Currently on a supported NodeJS verison (18)',
            },
        ]);

        // loop over framework providers as they implement similar functions multiple times
        let frameworkProviders: string[] = ['framework-onEvent', 'framework-isComplete', 'framework-onTimeout']

        for (var provider of frameworkProviders) {
            NagSuppressions.addResourceSuppressionsByPath(
                stack,
                `/${stack.stackName}/@aws-cdk--aws-eks.ClusterResourceProvider/Provider/${provider}/ServiceRole/Resource`, [
                {
                    id: 'AwsSolutions-IAM4',
                    reason: 'This is the basic lambda execution role, that is ok',
                },
            ]);

            NagSuppressions.addResourceSuppressionsByPath(
                stack,
                `/${stack.stackName}/@aws-cdk--aws-eks.ClusterResourceProvider/Provider/${provider}/ServiceRole/DefaultPolicy/Resource`, [
                {
                    id: 'AwsSolutions-IAM5',
                    reason: 'This is scoped to the invocation of the managed providers lambda functions only',
                },
            ]);

            NagSuppressions.addResourceSuppressionsByPath(
                stack,
                `/${stack.stackName}/@aws-cdk--aws-eks.ClusterResourceProvider/Provider/${provider}/Resource`, [
                {
                    id: 'AwsSolutions-L1',
                    reason: 'This is packaged as a core part of Blueprints, will be updated as part of their release schedule. Currently on a supported NodeJS verison (18)',
                },
            ]);
        }; // end loop

        NagSuppressions.addResourceSuppressionsByPath(
            stack,
            `/${stack.stackName}/@aws-cdk--aws-eks.ClusterResourceProvider/Provider/waiter-state-machine/Role/DefaultPolicy/Resource`, [
            {
                id: 'AwsSolutions-IAM5',
                reason: 'This is scoped to the invocation of the managed providers lambda functions only',
            },
        ]);

        NagSuppressions.addResourceSuppressionsByPath(
            stack,
            `/${stack.stackName}/@aws-cdk--aws-eks.KubectlProvider/Handler/Resource`, [
            {
                id: 'AwsSolutions-L1',
                reason: 'This is packaged as a core part of Blueprints, will be updated as part of their release schedule. Currently on a supported Python3 verison (3.10)',
            },
        ]);

        NagSuppressions.addResourceSuppressionsByPath(
            stack,
            `/${stack.stackName}/@aws-cdk--aws-eks.KubectlProvider/Provider/framework-onEvent/ServiceRole/Resource`, [
            {
                id: 'AwsSolutions-IAM4',
                reason: 'This is the basic lambda execution role and VPC execution role, that is ok',
            },
        ]);

        NagSuppressions.addResourceSuppressionsByPath(
            stack,
            `/${stack.stackName}/@aws-cdk--aws-eks.KubectlProvider/Provider/framework-onEvent/ServiceRole/DefaultPolicy/Resource`, [
            {
                id: 'AwsSolutions-IAM5',
                reason: 'This is scoped to the invocation of the managed providers lambda functions only',
            },
        ]);

        NagSuppressions.addResourceSuppressionsByPath(
            stack,
            `/${stack.stackName}/@aws-cdk--aws-eks.KubectlProvider/Provider/framework-onEvent/Resource`, [
            {
                id: 'AwsSolutions-L1',
                reason: 'This is packaged as a core part of Blueprints, will be updated as part of their release schedule. Currently on a supported NodeJS verison (18)',
            },
        ]);

        NagSuppressions.addResourceSuppressionsByPath(
            stack,
            `/${stack.stackName}/${stack.stackName}-vpc/Resource`, [
            {
                id: 'AwsSolutions-VPC7',
                reason: 'suppressed for demo purposes',
            },
        ]);

        NagSuppressions.addResourceSuppressionsByPath(
            stack,
            `/${stack.stackName}/${stack.stackName}-kms-key/Resource`, [
            {
                id: 'AwsSolutions-KMS5',
                reason: 'suppressed for demo purposes',
            },
        ]);

        NagSuppressions.addResourceSuppressionsByPath(
            stack,
            `/${stack.stackName}/${stack.stackName}/Resource/Resource/Default`, [
            {
                id: 'AwsSolutions-EKS1',
                reason: 'suppressed for demo purposes',
            },
        ]);

        NagSuppressions.addResourceSuppressionsByPath(
            stack,
            `/${stack.stackName}/${stack.stackName}/Nodegroup${stack.stackName}-ng-ng/NodeGroupRole/Resource`, [
            {
                id: 'AwsSolutions-IAM4',
                reason: 'suppressed for demo purposes',
            },
        ]);


        NagSuppressions.addResourceSuppressionsByPath(
            stack,
            `/${stack.stackName}/team-infrastructureAccessRole/DefaultPolicy/Resource`, [
            {
                id: 'AwsSolutions-IAM5',
                reason: 'This wildcard is just for eks:ListClusters so that is ok',
            },
        ]);

        NagSuppressions.addResourceSuppressionsByPath(
            stack,
            `/${stack.stackName}/team-oneAccessRole/DefaultPolicy/Resource`, [
            {
                id: 'AwsSolutions-IAM5',
                reason: 'This wildcard is just for eks:ListClusters so that is ok',
            },
        ]);

        NagSuppressions.addResourceSuppressionsByPath(
            stack,
            `/${stack.stackName}/team-twoAccessRole/DefaultPolicy/Resource`, [
                {
                    id: 'AwsSolutions-IAM5',
                    reason: 'This wildcard is just for eks:ListClusters so that is ok',
                },
            ]);
    };
};