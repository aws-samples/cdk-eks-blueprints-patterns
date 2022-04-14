import { EksBlueprint, utils } from '@aws-quickstart/eks-blueprints';
import { DynatraceAddOn } from '@dynatrace/dynatrace-eks-blueprints-addon';
import * as cdk from 'aws-cdk-lib';

export default class DynatraceOperatorConstruct {

    async buildAsync(scope: cdk.App, id: string) {
        await prevalidateSecrets();
        // AddOns for the cluster
        const stackId = `${id}-blueprint`;

        const DynatraceOperator = new DynatraceAddOn({
            // Setup ssmSecret dynatrace-tokens described here (https://github.com/dynatrace-oss/dynatrace-eks-blueprints-addon#aws-secret-manager-secrets)
            ssmSecretName: 'dynatrace-tokens'
        })

        EksBlueprint.builder()
            .account(process.env.CDK_DEFAULT_ACCOUNT!)
            .region(process.env.CDK_DEFAULT_REGION)
            .addOns(DynatraceOperator)
            .build(scope, stackId);
    }

}

async function prevalidateSecrets() {
    try {
        await utils.validateSecret('dynatrace-tokens', process.env.CDK_DEFAULT_ACCOUNT!);
    }
    catch(error) {
        throw new Error("dynatrace-tokens secret must be setup for the DynatraceOperator pattern to work.");
    }
}
