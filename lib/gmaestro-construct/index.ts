import * as blueprints from '@aws-quickstart/eks-blueprints';
import * as gmaestroAddOn from '@granulate/gmaestro-eks-blueprints-addon';
import * as cdk from 'aws-cdk-lib';
import {prevalidateSecrets} from "../common/construct-utils";

const CLIENT_ID_SECRET_NAME = 'granulate-client-id';

export default class GmaestroConstruct {
    async buildAsync(scope: cdk.App, id: string) {
        await prevalidateSecrets(GmaestroConstruct.name, process.env.CDK_DEFAULT_REGION!, CLIENT_ID_SECRET_NAME);

        const stackId = `${id}-blueprint`;

        let gmaestroAddOnProps = {
            clientIdSecretName: CLIENT_ID_SECRET_NAME, // replace with a secret name in secrets manager that you have created
            clusterName: "test_cluster", // replace with the service name from the deployment yaml,
        } as gmaestroAddOn.GmaestroAddOnProps;

        const addOns: Array<blueprints.ClusterAddOn> = [
            new gmaestroAddOn.GmaestroAddOn(gmaestroAddOnProps)
        ];
        blueprints.EksBlueprint.builder()
            .account(process.env.CDK_DEFAULT_ACCOUNT!)
            .region(process.env.CDK_DEFAULT_REGION)
            .addOns(...addOns)
            .build(scope, stackId);
    }
}
