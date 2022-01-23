import * as cdk from '@aws-cdk/core';
import { EksBlueprint } from '@aws-quickstart/ssp-amazon-eks';
import { RezilionAddOn } from '@rezilion/rezilion-ssp-addon';

export default class RezilionConstruct extends cdk.Construct {

    constructor(scope: cdk.Construct, id: string) {
        super(scope, id);

        const Rezilion = new RezilionAddOn('dynamic_test_api_key');
        const stackId = `${id}-blueprint`;

        EksBlueprint.builder()
            .addOns(Rezilion)
            .build(scope, stackId);
    }
}
