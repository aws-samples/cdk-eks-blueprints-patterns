import { Construct } from 'constructs';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import * as eks from 'aws-cdk-lib/aws-eks';
import { GrafanaOperatorSecretAddon } from './grafana-operator-secret-addon';
import * as fs from 'fs';

export class GrafanaMonitoringConstruct {

    build(scope: Construct, id: string, contextAccount?: string, contextRegion?: string ) {

        const stackId = `${id}-grafana-monitor`;

        const account = contextAccount! || process.env.ACCOUNT_ID! || process.env.CDK_DEFAULT_ACCOUNT!;
        const region = contextRegion! || process.env.AWS_REGION! || process.env.CDK_DEFAULT_REGION!;

        this.create(scope, account, region)
            .build(scope, stackId);
    }

    create(scope: Construct, contextAccount?: string, contextRegion?: string ) {

        const account = contextAccount! || process.env.ACCOUNT_ID! || process.env.CDK_DEFAULT_ACCOUNT!;
        const region = contextRegion! || process.env.AWS_REGION! || process.env.CDK_DEFAULT_REGION!;
        
        // TODO: CFN import https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.Fn.html#static-importwbrvaluesharedvaluetoimport
        const ampWorkspaceName = "conformitronWorkspace";
        const ampEndpoint = blueprints.utils.valueFromContext(scope, "conformitron.amp.endpoint", "https://aps-workspaces.<region>.amazonaws.com/workspaces/<workspace-id>/");
        const ampWorkspaceArn = blueprints.utils.valueFromContext(scope, "conformitron.amp.arn", "arn:aws:aps:<region>:<accountid>:workspace/<workspace-id>");
        
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
                logGroupName: `/aws/eks/conformitron/workspace`,
                logStreamName: `$NODE_NAME`,
                logRetentionDays: 30,
                awsRegion: region 
            }
        };

        const fluxRepository: blueprints.FluxGitRepo = blueprints.utils.valueFromContext(scope, "fluxRepository", undefined);
        fluxRepository.values!.AMG_AWS_REGION = region;
        fluxRepository.values!.AMG_ENDPOINT_URL = blueprints.utils.valueFromContext(scope, "conformitron.amg.endpoint","https://<grafana-id>.grafana-workspace.<region>.amazonaws.com"); 

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
            .withAmpProps(ampAddOnProps)
            .enableOpenSourcePatternAddOns()
            .addOns(
                ...addOns
            );
    }
}