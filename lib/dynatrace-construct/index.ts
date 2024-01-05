import { EksBlueprint } from '@aws-quickstart/eks-blueprints';
import { DynatraceAddOn } from '@dynatrace/dynatrace-eks-blueprints-addon';
import * as cdk from 'aws-cdk-lib';
import { prevalidateSecrets } from '../common/construct-utils';

export default class DynatraceOperatorConstruct {

    async buildAsync(scope: cdk.App, id: string) {
        await prevalidateSecrets(DynatraceOperatorConstruct.name, undefined, 'dynatrace-tokens');
        // AddOns for the cluster
        const stackId = `${id}-blueprint`;

        const DynatraceOperator = new DynatraceAddOn();

        EksBlueprint.builder()
            .account(process.env.CDK_DEFAULT_ACCOUNT!)
            .region(process.env.CDK_DEFAULT_REGION)
            .version('auto')
            .addOns(DynatraceOperator)
            .build(scope, stackId);
    }

}
