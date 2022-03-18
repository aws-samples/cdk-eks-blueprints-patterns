import * as cdk from '@aws-cdk/core';
import { EksBlueprint } from '@aws-quickstart/ssp-amazon-eks';
import { KeptnControlPlaneAddOn } from '@keptn/keptn-cp-ssp-addon'

export default class KeptnControlPlaneConstruct extends cdk.Construct {

    constructor(scope: cdk.Construct, id: string) {
        super(scope, id);
        // AddOns for the cluster
        const stackId = `${id}-blueprint`;

        const KeptnControlPlane = new KeptnControlPlaneAddOn({
            // uncomment after you setup the ssm secret keptn-secrets.
            // ssmSecretName: 'keptn-secrets'
        })

        EksBlueprint.builder()
            .account(process.env.CDK_DEFAULT_ACCOUNT!)
            .region(process.env.CDK_DEFAULT_REGION)
            .addOns(KeptnControlPlane)
            .build(scope, stackId);
    }
}
