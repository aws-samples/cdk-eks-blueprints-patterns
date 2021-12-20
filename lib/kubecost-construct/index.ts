import * as cdk from '@aws-cdk/core';
import * as ssp from '@aws-quickstart/ssp-amazon-eks'

import { KubecostAddOn, KubecostAddOnProps } from '@kubecost/kubecost-ssp-addon';

export default class KubecostConstruct extends cdk.Construct {
    constructor(scope: cdk.Construct, id: string) {
        super(scope, id);

        // AddOns for the cluster
        const addOns: Array<ssp.ClusterAddOn> = [
            new KubecostAddOn()
        ];

        const stackID = `${id}-blueprint`;

        new ssp.EksBlueprint(scope, { id: stackID, addOns}, {
            env: {
                account : process.env.CDK_DEFAULT_ACCOUNT!,
                region: process.env.CDK_DEFAULT_REGION
            },
        });
    }
}
