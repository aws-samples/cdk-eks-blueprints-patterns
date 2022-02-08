import * as cdk from '@aws-cdk/core';
import { EksBlueprint } from '@aws-quickstart/ssp-amazon-eks';
import { DynatraceOperatorAddOn } from '@dynatrace/dynatrace-ssp-addon'

export default class DynatraceOperatorConstruct extends cdk.Construct {

    constructor(scope: cdk.Construct, id: string) {
        super(scope, id);
        // AddOns for the cluster
        const stackId = `${id}-blueprint`;

        const DynatraceOperator = new DynatraceOperatorAddOn({
            // Setup ssmSecret dynatrace-tokens described here (https://github.com/dynatrace-oss/dynatrace-ssp-addon#aws-secret-manager-secrets)
            ssmSecretName: 'dynatrace-tokens'
        })

        EksBlueprint.builder()
            .account(process.env.CDK_DEFAULT_ACCOUNT!)
            .region(process.env.CDK_DEFAULT_REGION)
            .addOns(DynatraceOperator)
            .build(scope, stackId);
    }
}
