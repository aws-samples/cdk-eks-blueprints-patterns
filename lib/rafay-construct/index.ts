import * as blueprints from '@aws-quickstart/eks-blueprints';
import * as rafayAddOn from '@rafaysystems/rafay-eks-blueprints-addon';
import { prevalidateSecrets } from '../common/construct-utils';
import * as cdk from 'aws-cdk-lib';

export default class RafayConstruct {
    async buildAsync(scope: cdk.App, id: string) {
        let rafayConfig = {
            organizationName: "rafay-eks-org-1", // replace with your organization Name
            email: "abc@example.com", // replace with your email
            firstName: "John", // replace with your first Name
            lastName: "Doe", // replace with your last Name
            passwordSecret: "rafay-password-json", // replace with a secret name in secrets manager that you have created, must contain a single field "password"
            clusterName: "eks-cluster-1", // replace with the name that you want the cluster to be created in Rafay Console
            blueprintName: "minimal"
        } as rafayAddOn.RafayConfig;

        await prevalidateSecrets(RafayConstruct.name, undefined, rafayConfig.passwordSecret!);
        const stackId = `${id}-blueprint`;

        const addOns: Array<blueprints.ClusterAddOn> = [
            new rafayAddOn.RafayClusterAddOn(rafayConfig)
        ];
        blueprints.EksBlueprint.builder()
            .account(process.env.CDK_DEFAULT_ACCOUNT!)
            .region(process.env.CDK_DEFAULT_REGION)
            .addOns(...addOns)
            .version('auto')
            .build(scope, stackId);
    }
}
