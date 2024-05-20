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
                    __dirname + '/../common/resources/amp-config/alerting-rules.yml',
                    __dirname + '/../common/resources/amp-config/recording-rules.yml'
                ]
            }
        };

        let doc = blueprints.utils.readYamlDocument(__dirname + '/../common/resources/otel-collector-config.yml');
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

        fs.writeFileSync(__dirname + '/../common/resources/otel-collector-config-new.yml', doc);

        ampAddOnProps.openTelemetryCollector = {
            manifestPath: __dirname + '/../common/resources/otel-collector-config-new.yml',
            manifestParameterMap: {
                logGroupName: `/aws/eks/conformitron/myWorkspace`,
                logStreamName: `$NODE_NAME`,
                logRetentionDays: 30,
                awsRegion: region 
            }
        };

        const fluxRepository: blueprints.FluxGitRepo = blueprints.utils.valueFromContext(scope, "fluxRepository", undefined);
        fluxRepository.values!.AMG_AWS_REGION = region;
        fluxRepository.values!.AMG_ENDPOINT_URL = 'https://g-76edcf29d5.grafana-workspace.us-west-2.amazonaws.com'; // update this to blueprints.utils.valueFromContext(scope, "fluxRepository", undefined)

        Reflect.defineMetadata("ordered", true, blueprints.addons.GrafanaOperatorAddon); //sets metadata ordered to true for GrafanaOperatorAddon
        const addOns: Array<blueprints.ClusterAddOn> = [
            new blueprints.addons.FluxCDAddOn({"repositories": [fluxRepository]}),
            new GrafanaOperatorSecretAddon(),
            new blueprints.addons.SSMAgentAddOn()
        ];

        return blueprints.ObservabilityBuilder.builder()
            .account(account)
            .region(region)
            .version(eks.KubernetesVersion.V1_27)
            .resourceProvider(ampWorkspaceName, new blueprints.CreateAmpProvider(ampWorkspaceName, ampWorkspaceName))
            .withCoreDnsProps({
                version:"v1.9.3-eksbuild.11"
            })
            .withAmpProps(ampAddOnProps)
            .enableOpenSourcePatternAddOns()
            .addOns(
                ...addOns
            );
    }
}