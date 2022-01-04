import * as cdk from '@aws-cdk/core';
import { EksBlueprint } from '@aws-quickstart/ssp-amazon-eks';
import { KubecostAddOn } from '@kubecost/kubecost-ssp-addon';


export default class KubecostConstruct extends cdk.Construct {
    constructor(scope: cdk.Construct, id: string) {
        super(scope, id);
        // AddOns for the cluster
        const stackId = `${id}-blueprint`;

        EksBlueprint.builder()
            .account(process.env.CDK_DEFAULT_ACCOUNT!)
            .region(process.env.CDK_DEFAULT_REGION)
            .addOns(new KubecostAddOn())
            .build(scope, stackId);
    }
}
