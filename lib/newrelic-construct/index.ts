import * as blueprints from '@aws-quickstart/eks-blueprints';
import { NewRelicAddOn } from '@newrelic/newrelic-eks-blueprints-addon';
import { Construct } from "constructs";


export default class NewRelicConstruct extends Construct {
    constructor(scope: Construct, id: string) {
        super(scope, id);

        const stackId = `${id}-blueprint`;

        const addOns: Array<blueprints.ClusterAddOn> = [
            new blueprints.addons.SecretsStoreAddOn(),
            new NewRelicAddOn({
                version: "4.2.0-beta",
                newRelicClusterName: id,
                // Uncomment "awsSecretName" after you create your secret in AWS Secrets Manager.
                // Required: nrLicenseKey
                // Optional: pixieDeployKey, pixieApiKey
                //
                // Format:
                // {
                //     "pixieDeployKey": "px-dep-XXXX",
                //     "pixieApiKey": "px-api-XXXX",
                //     "nrLicenseKey": "XXXXNRAL"
                // }
                awsSecretName: "newrelic-pixie-combined",

                // Uncomment "installPixie" and "installPixieIntegration" if installing Pixie.
                // installPixie: true,
                // installPixieIntegration: true,

                // For additional install options, visit the New Relic addon docs:
                // https://github.com/newrelic-experimental/newrelic-eks-blueprints-addon
            })
        ];

        blueprints.EksBlueprint.builder()
            .account(process.env.CDK_DEFAULT_ACCOUNT!)
            .region(process.env.CDK_DEFAULT_REGION)
            .addOns(...addOns)
            .build(scope, stackId);
    }
}