import { Construct } from 'constructs';

// Blueprints Lib
import * as blueprints from '@aws-quickstart/eks-blueprints';
import * as amp from 'aws-cdk-lib/aws-aps';
import { EksAnywhereSecretsAddon } from './eksa-secret-stores';
import * as fs from 'fs';
import { ampProvider } from './grafana-monitor-builder';


export default class MultiClusterBuilderConstruct {
    build(scope: Construct, id: string, account?: string, region?: string ) {
        // Setup platform team
        const accountID = account ?? process.env.CDK_DEFAULT_ACCOUNT! ;
        const awsRegion =  region ?? process.env.CDK_DEFAULT_REGION! ;
 
        const stackID = `${id}-blueprint`;
        this.create(scope, accountID, awsRegion)
            .build(scope, stackID);
    }
    

    create(scope: Construct, account?: string, region?: string ) {
        // Setup platform team
        const accountID = account ?? process.env.CDK_DEFAULT_ACCOUNT! ;
        const awsRegion =  region ?? process.env.CDK_DEFAULT_REGION! ;

        const ampWorkspaceName = "conformitronWorkspace";
        const ampPrometheusWorkspace = (blueprints.getNamedResource(ampWorkspaceName) as unknown as amp.CfnWorkspace);
        const ampEndpoint = ampPrometheusWorkspace.attrPrometheusEndpoint;
        const ampWorkspaceArn = ampPrometheusWorkspace.attrArn;

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
                logGroupName: `/aws/eks/conformitron/${ampWorkspaceName}`,
                logStreamName: `$NODE_NAME`,
                logRetentionDays: 30,
                awsRegion: region 
            }
        };
        // ampAddOnProps.enableAPIServerJob = true,

        // ampAddOnProps.ampRules?.ruleFilePaths.push(
        //     __dirname + '/../common/resources/amp-config/apiserver/recording-rules.yml'
        // );
        

        return blueprints.ObservabilityBuilder.builder()
            .account(accountID)
            .region(awsRegion)
            // run "eksctl utils describe-addon-versions --kubernetes-version <1.26/1.27/1.28> --name coredns | grep AddonVersion" to find best option
            .withCoreDnsProps({
                version:"v1.9.3-eksbuild.11"
            })
            .withAmpProps(ampAddOnProps)
            .enableOpenSourcePatternAddOns()
            .resourceProvider(ampWorkspaceName, ampProvider)
            .addOns(
                new blueprints.addons.FluxCDAddOn({
                    repositories:[{
                        name: "eks-cloud-addons-conformance",
                        namespace: "flux-system",
                        repository: {
                            repoUrl: 'https://github.com/aws-samples/eks-anywhere-addons',
                            targetRevision: "main",
                        },
                        values: {
                        },
                        kustomizations: [
                            {kustomizationPath: "./eks-anywhere-common/Addons/Core/Botkube"},
                            {kustomizationPath: "./eks-anywhere-common/Addons/Core/Kube-Observer"},
                            // {kustomizationPath: "./eks-anywhere-common/Testers/"},
                            // {kustomizationPath: "./eks-cloud/Testers"},
                            {kustomizationPath: "./eks-anywhere-common/Addons/Partner"}, 
                            {kustomizationPath: "./eks-cloud/Partner"}, 
                        ],
                    }],
                }),
                new EksAnywhereSecretsAddon(),
                new blueprints.addons.EbsCsiDriverAddOn(),
                new blueprints.addons.ClusterAutoScalerAddOn()
            );
    }
}


