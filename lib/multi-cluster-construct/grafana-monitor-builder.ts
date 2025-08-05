import { Construct } from 'constructs';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as amp from 'aws-cdk-lib/aws-aps';
import { GrafanaOperatorSecretAddon } from './grafana-operator-secret-addon';
import * as fs from 'fs';

export class GrafanaMonitoringConstruct {

    build(scope: Construct, id: string, contextAccount?: string, contextRegion?: string ) {

        const stackId = `${id}-grafana-monitor`;

        const account = contextAccount! || process.env.COA_ACCOUNT_ID! || process.env.CDK_DEFAULT_ACCOUNT!;
        const region = contextRegion! || process.env.COA_AWS_REGION! || process.env.CDK_DEFAULT_REGION!;

        this.create(scope, account, region)
            .build(scope, stackId);
    }

    create(scope: Construct, contextAccount?: string, contextRegion?: string ) {

        const account = contextAccount! || process.env.COA_ACCOUNT_ID! || process.env.CDK_DEFAULT_ACCOUNT!;
        const region = contextRegion! || process.env.COA_AWS_REGION! || process.env.CDK_DEFAULT_REGION!;
        

        const ampWorkspaceName = "conformitronWorkspace";
        // const ampPrometheusWorkspace = (blueprints.getNamedResource(ampWorkspaceName) as unknown as amp.CfnWorkspace);
        const ampEndpoint = `https://aps-workspaces.us-west-2.amazonaws.com/workspaces/ws-b08fda60-7e79-450c-972d-262ebac98c3e/`;
        const ampWorkspaceArn = `arn:aws:aps:us-west-2:867286930927:workspace/ws-b08fda60-7e79-450c-972d-262ebac98c3e`;

        const ampAddOnProps: blueprints.AmpAddOnProps = {
            ampPrometheusEndpoint: ampEndpoint,
            ampRules: {
                ampWorkspaceArn: ampWorkspaceArn,
                ruleFilePaths: [
                    __dirname + '/resources/amp-config/alerting-rules.yml',
                    __dirname + '/resources/amp-config/recording-rules.yml'
                ]
            }
        };

        let doc = blueprints.utils.readYamlDocument(__dirname + '/resources/otel-collector-config.yml');
        doc = blueprints.utils.changeTextBetweenTokens(
            doc,
            "{{ start enableJavaMonJob }}",
            "{{ stop enableJavaMonJob }}",
            false
        );
        doc = blueprints.utils.changeTextBetweenTokens(
            doc,
            "{{ start enableNginxMonJob }}",
            "{{ stop enableNginxMonJob }}",
            false
        );
        doc = blueprints.utils.changeTextBetweenTokens(
            doc,
            "{{ start enableIstioMonJob }}",
            "{{ stop enableIstioMonJob }}",
            false
        );
        doc = blueprints.utils.changeTextBetweenTokens(
            doc,
            "{{ start enableAPIserverJob }}",
            "{{ stop enableAPIserverJob }}",
            false
        );
        doc = blueprints.utils.changeTextBetweenTokens(
            doc,
            "{{ start enableAdotMetricsCollectionJob}}",
            "{{ stop enableAdotMetricsCollectionJob }}",
            false
        );
        doc = blueprints.utils.changeTextBetweenTokens(
            doc,
            "{{ start enableAdotMetricsCollectionTelemetry }}",
            "{{ stop enableAdotMetricsCollectionTelemetry }}",
            true
        );

        doc = blueprints.utils.changeTextBetweenTokens(
            doc,
            "{{ start enableAdotContainerLogsReceiver }}",
            "{{ stop enableAdotContainerLogsReceiver }}",
            true
        );
        doc = blueprints.utils.changeTextBetweenTokens(
            doc,
            "{{ start enableAdotContainerLogsExporter }}",
            "{{ stop enableAdotContainerLogsExporter }}",
            true
        );

        fs.writeFileSync(__dirname + '/resources/otel-collector-config-new.yml', doc);

        ampAddOnProps.openTelemetryCollector = {
            manifestPath: __dirname + '/resources/otel-collector-config-new.yml',
            manifestParameterMap: {
                logGroupName: `/aws/eks/conformitron/myWorkspace`,
                logStreamName: `$NODE_NAME`,
                logRetentionDays: 30,
                awsRegion: region 
            }
        };

        Reflect.defineMetadata("ordered", true, blueprints.addons.GrafanaOperatorAddon); //sets metadata ordered to true for GrafanaOperatorAddon
        const addOns: Array<blueprints.ClusterAddOn> = [
            new blueprints.addons.FluxCDAddOn({
                repositories:[{
                    name: "grafana-dashboards",
                    namespace: "grafana-operator",
                    repository: {
                        name: "grafana-dashboards",
                        repoUrl: 'https://github.com/aws-observability/aws-observability-accelerator',
                        targetRevision: "main",
                        path: "./artifacts/grafana-operator-manifests/eks/infrastructure"
                    },
                    values: {
                        AMG_AWS_REGION: region,
                        AMG_ENDPOINT_URL: 'https://g-76edcf29d5.grafana-workspace.us-west-2.amazonaws.com',
                        GRAFANA_CLUSTER_DASH_URL : "https://raw.githubusercontent.com/aws-observability/aws-observability-accelerator/main/artifacts/grafana-dashboards/eks/infrastructure/cluster.json",
                        GRAFANA_KUBELET_DASH_URL : "https://raw.githubusercontent.com/aws-observability/aws-observability-accelerator/main/artifacts/grafana-dashboards/eks/infrastructure/kubelet.json",
                        GRAFANA_NSWRKLDS_DASH_URL : "https://raw.githubusercontent.com/aws-observability/aws-observability-accelerator/main/artifacts/grafana-dashboards/eks/infrastructure/namespace-workloads.json",
                        GRAFANA_NODEEXP_DASH_URL : "https://raw.githubusercontent.com/aws-observability/aws-observability-accelerator/main/artifacts/grafana-dashboards/eks/infrastructure/nodeexporter-nodes.json",
                        GRAFANA_NODES_DASH_URL : "https://raw.githubusercontent.com/aws-observability/aws-observability-accelerator/main/artifacts/grafana-dashboards/eks/infrastructure/nodes.json",
                        GRAFANA_WORKLOADS_DASH_URL : "https://raw.githubusercontent.com/aws-observability/aws-observability-accelerator/main/artifacts/grafana-dashboards/eks/infrastructure/workloads.json"

                    },
                    kustomizations: [
                        {kustomizationPath: "./artifacts/grafana-operator-manifests/eks/infrastructure"}
                    ],
                }],
            }),
            new GrafanaOperatorSecretAddon(),
            new blueprints.addons.SSMAgentAddOn()
        ];

        return blueprints.ObservabilityBuilder.builder()
            .account(account)
            .region(region)
            .version(eks.KubernetesVersion.V1_31)
            .resourceProvider(ampWorkspaceName, new blueprints.CreateAmpProvider(ampWorkspaceName, ampWorkspaceName))
            .withAmpProps(ampAddOnProps)
            .enableOpenSourcePatternAddOns()
            .addOns(
                ...addOns
            );
    }
}