import { Construct } from 'constructs';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import * as amp from 'aws-cdk-lib/aws-aps';
import * as eks from 'aws-cdk-lib/aws-eks';
import { GrafanaOperatorSecretAddon } from './grafana-operator-secret-addon';
import { getSSMSecureString } from './get-ssm-securestring';

export default class GrafanaMonitoringConstruct {

    async build(scope: Construct, id: string, contextAccount?: string, contextRegion?: string ) {

        const stackId = `${id}-grafana-monitor`;

        const account = contextAccount! || process.env.COA_ACCOUNT_ID! || process.env.CDK_DEFAULT_ACCOUNT!;
        const region = contextRegion! || process.env.COA_AWS_REGION! || process.env.CDK_DEFAULT_REGION!;

        const amgInfo = JSON.parse(await getSSMSecureString('/cdk-accelerator/amg-context',region))['context'];
        const amgWorkspaceId = amgInfo.AMG_WS_ID;

        this.create(scope,amgWorkspaceId, account, region)
            .build(scope, stackId);
    }

    create(scope: Construct, grafanaId: string, contextAccount?: string, contextRegion?: string ) {

        const account = contextAccount! || process.env.COA_ACCOUNT_ID! || process.env.CDK_DEFAULT_ACCOUNT!;
        const region = contextRegion! || process.env.COA_AWS_REGION! || process.env.CDK_DEFAULT_REGION!;

        const ampWorkspaceName = "multi-cluster-monitoring";
        const ampPrometheusEndpoint = (blueprints.getNamedResource(ampWorkspaceName) as unknown as amp.CfnWorkspace);

        Reflect.defineMetadata("ordered", true, blueprints.addons.GrafanaOperatorAddon); //sets metadata ordered to true for GrafanaOperatorAddon

        const fluxRepository: blueprints.FluxGitRepo = blueprints.utils.valueFromContext(scope, "fluxRepository", undefined);
        fluxRepository.values!.AMG_AWS_REGION = region;
        fluxRepository.values!.AMP_ENDPOINT_URL = ampPrometheusEndpoint.attrPrometheusEndpoint;
        fluxRepository.values!.AMG_ENDPOINT_URL = `https://${grafanaId}.grafana-workspace.${region}.amazonaws.com`;

        const addOns: Array<blueprints.ClusterAddOn> = [
            new blueprints.addons.ExternalsSecretsAddOn(),
            new blueprints.addons.GrafanaOperatorAddon({
                createNamespace: true,
            }),
            new blueprints.addons.FluxCDAddOn({"repositories": [fluxRepository]}),
            new GrafanaOperatorSecretAddon(),
            new blueprints.addons.SSMAgentAddOn()
        ];

        return blueprints.ObservabilityBuilder.builder()
            .account(account)
            .region(region)
            .version(eks.KubernetesVersion.V1_27)
            .resourceProvider(ampWorkspaceName, new blueprints.CreateAmpProvider(ampWorkspaceName, ampWorkspaceName))
            .addOns(
                ...addOns
            );
    }
}