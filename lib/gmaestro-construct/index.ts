import * as blueprints from '@aws-quickstart/eks-blueprints';
import * as gmaestroAddOn from '@granulate/gmaestro-eks-blueprints-addon';
import * as cdk from 'aws-cdk-lib';
import {prevalidateSecrets} from "../common/construct-utils";

const MAESTRO_SECRET_NAME = 'gmaestro-secret-param';

export const gmaestroProps: { [key: string]: any } = {
    "clusterName": process.env.MAESTRO_SERVICE_NAME,
    "createNamespace": true,
    "namespace": process.env.MAESTRO_NAMESPACE_NAME
};

export default class GmaestroConstruct {
    async buildAsync(scope: cdk.App, id: string) {
        await prevalidateSecrets(GmaestroConstruct.name, process.env.CDK_DEFAULT_REGION!, MAESTRO_SECRET_NAME);

        const stackId = `${id}-blueprint`;

        let gmaestroAddOnProps = {
            clientIdSecretName: MAESTRO_SECRET_NAME,
            clusterName: gmaestroProps.clusterName,
            createNamespace: gmaestroProps.createNamespace,
            namespace: gmaestroProps.namespace,
        } as gmaestroAddOn.GmaestroAddOnProps;

        const addOns: Array<blueprints.ClusterAddOn> = [
            new blueprints.addons.ClusterAutoScalerAddOn(),
            new gmaestroAddOn.GmaestroAddOn(gmaestroAddOnProps)
        ];
        blueprints.EksBlueprint.builder()
            .account(process.env.CDK_DEFAULT_ACCOUNT!)
            .region(process.env.CDK_DEFAULT_REGION)
            .addOns(...addOns)
            .build(scope, stackId);
    }
}
