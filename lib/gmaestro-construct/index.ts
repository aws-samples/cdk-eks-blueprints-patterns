import * as blueprints from '@aws-quickstart/eks-blueprints';
import * as gmaestroAddOn from '@granulate/gmaestro-eks-blueprints-addon';
import * as cdk from 'aws-cdk-lib';
import {prevalidateSecrets} from "../common/construct-utils";

const GRAFANA_METRICS_SECRET_NAME = 'granulate-grafana-metrics-auth-key';
const GRAFANA_LOGS_SECRET_NAME = 'granulate-grafana-logs-auth-key';
const CLIENT_ID_SECRET_NAME = 'granulate-client-id';

export default class GmaestroConstruct {
    async buildAsync(scope: cdk.App, id: string) {
        await prevalidateSecrets(GmaestroConstruct.name, process.env.CDK_DEFAULT_REGION!, GRAFANA_METRICS_SECRET_NAME, GRAFANA_LOGS_SECRET_NAME, CLIENT_ID_SECRET_NAME);

        const stackId = `${id}-blueprint`;

        let gmaestroAddOnProps = {
            namespace: "test", // replace with the namespace from the deployment yaml
            clientIdSecretName: CLIENT_ID_SECRET_NAME, // replace with a secret name in secrets manager that you have created
            clientName: "test_client", // replace with the client name from the deployment yaml
            clusterName: "test_cluster", // replace with the service name from the deployment yaml
            grafanaMetricsSecretName: GRAFANA_METRICS_SECRET_NAME, // replace with a secret name in secrets manager that you have created
            grafanaLogsSecretName: GRAFANA_LOGS_SECRET_NAME // replace with a secret name in secrets manager that you have created
        } as gmaestroAddOn.GmaestroAddOnProps

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
