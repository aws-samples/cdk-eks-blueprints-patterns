import { Construct } from 'constructs';
import * as blueprints from '@aws-quickstart/eks-blueprints'
import { DatadogAddOn } from '@datadog/datadog-eks-blueprints-addon';

export default class DatadogConstruct {
    constructor(scope: Construct, id: string) {

        const stackID = `${id}-blueprint`

        const addOns: Array<blueprints.ClusterAddOn> = [
            new DatadogAddOn({
                apiKeyAWSSecret: 'datadog-api-key'
            })
        ];

        blueprints.EksBlueprint.builder()
            .account(process.env.CDK_DEFAULT_ACCOUNT!)
            .region(process.env.CDK_DEFAULT_REGION!)
            .addOns(...addOns)
            .build(scope, stackID);
    }
}
