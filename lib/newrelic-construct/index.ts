import * as cdk from '@aws-cdk/core';
import { EksBlueprint } from '@aws-quickstart/ssp-amazon-eks';
import { NewRelicAddOn } from '@newrelic/newrelic-ssp-addon';


export default class NewRelicConstruct extends cdk.Construct {
    constructor(scope: cdk.Construct, id: string) {
        super(scope, id);
        // AddOns for the cluster
        const stackId = `${id}-blueprint`;

        const NewRelic = new NewRelicAddOn({
            // Uncomment after you create the "newrelic-license-key" secret in
            // AWS Secrets Manager.  Use Plaintext mode.
            // nrLicenseKeySecretName: "newrelic-license-key",
            newRelicClusterName: "demo-cluster"
        })

        EksBlueprint.builder()
            .account(process.env.CDK_DEFAULT_ACCOUNT!)
            .region(process.env.CDK_DEFAULT_REGION)
            .addOns(NewRelic))
            .build(scope, stackId);
}
