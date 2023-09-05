import * as blueprints from '@aws-quickstart/eks-blueprints';
import * as gmaestroAddOn from '@granulate/gmaestro-eks-blueprints-addon';
import * as cdk from 'aws-cdk-lib';
import {prevalidateSecrets} from "../common/construct-utils";


export default class GmaestroConstruct {
    async buildAsync(scope: cdk.App, id: string) {
        const clientIdSecretName = process.env.MAESTRO_SECRET_NAME;
        if (clientIdSecretName === undefined) {
            throw new Error("secret must be setup for the gMaestro pattern pattern to work");
        }
        await prevalidateSecrets(GmaestroConstruct.name, process.env.CDK_DEFAULT_REGION!, clientIdSecretName);

        const clusterName = blueprints.utils.valueFromContext(scope, "clusterName", undefined);
        const namespace = blueprints.utils.valueFromContext(scope, "namespace", undefined);
        if (clusterName === undefined || namespace === undefined) {
            throw new Error("clusterName and namespace must be setup for the gMaestro pattern pattern to work");
        }

        const stackId = `${id}-blueprint`;

        let gmaestroAddOnProps = {
            clientIdSecretName: clientIdSecretName,
            clusterName: clusterName,
            createNamespace: true,
            namespace: namespace,
        } as gmaestroAddOn.GmaestroAddOnProps;

        const addOns: Array<blueprints.ClusterAddOn> = [
            new blueprints.MetricsServerAddOn(),
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
