import * as blueprints from '@aws-quickstart/eks-blueprints';
import * as rafayAddOn from '@rafaysystems/rafay-eks-blueprints-addon';
import { prevalidateSecrets } from '../common/construct-utils';
import * as cdk from 'aws-cdk-lib';

export default class RafayConstruct {
    async buildAsync(scope: cdk.App, id: string) {
        await prevalidateSecrets(RafayConstruct.name, undefined, 'rafay-password-secret');
        const stackId = `${id}-blueprint`;

        let rafayConfig = {
            organizationName: "rafay-eks-org-1", // replace with your organization Name
            email: "abc@example.com", // replace with your email
            firstName: "John", // replace with your first Name
            lastName: "Doe", // replace with your last Name
            passwordSecret: "rafay-password-secret", // replace with a secret name in secrets manager that you have created
            clusterName: "eks-cluster-1", // replace with the name that you want the cluster to be created in Rafay Console
            blueprintName: "minimal"
        } as rafayAddOn.RafayConfig;

        const addOns: Array<blueprints.ClusterAddOn> = [
            new rafayAddOn.RafayClusterAddOn(rafayConfig)
        ];
        blueprints.EksBlueprint.builder()
            .account(process.env.CDK_DEFAULT_ACCOUNT!)
            .region(process.env.CDK_DEFAULT_REGION)
            .addOns(...addOns)
            .build(scope, stackId);
    }
}
