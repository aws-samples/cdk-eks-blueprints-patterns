import * as blueprints from '@aws-quickstart/eks-blueprints';
import * as gmaestroAddOn from '@granulate/gmaestro-eks-blueprints-addon';
import * as cdk from 'aws-cdk-lib';
import {prevalidateSecrets} from "../common/construct-utils";


export default class GmaestroConstruct {
    async buildAsync(scope: cdk.App, id: string) {
        const MAESTRO_SECRET_NAME = blueprints.utils.valueFromContext(scope, "secretParamName", undefined);
        await prevalidateSecrets(GmaestroConstruct.name, process.env.CDK_DEFAULT_REGION!, MAESTRO_SECRET_NAME);

        const stackId = `${id}-blueprint`;

        let gmaestroAddOnProps = {
            clientIdSecretName: MAESTRO_SECRET_NAME,
            clusterName: blueprints.utils.valueFromContext(scope, "clusterName", undefined),
            createNamespace: true,
            namespace: blueprints.utils.valueFromContext(scope, "namespace", undefined),
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
