import { Construct } from 'constructs';

// Blueprints Lib
import * as blueprints from '@aws-quickstart/eks-blueprints';
import * as amp from 'aws-cdk-lib/aws-aps';
import { EksAnywhereSecretsAddon } from './eksa-secret-stores';
import * as fs from 'fs';


export default class MultiClusterBuilderConstruct {
    build(scope: Construct, id: string, workspaceName: string, account?: string, region?: string ) {
        // Setup platform team
        const accountID = account ?? process.env.CDK_DEFAULT_ACCOUNT! ;
        const awsRegion =  region ?? process.env.CDK_DEFAULT_REGION! ;
 
        const stackID = `${id}-blueprint`;
        this.create(scope, workspaceName, accountID, awsRegion)
            .build(scope, stackID);
    }
    

    create(scope: Construct, workspaceName: string, account?: string, region?: string ) {
        // Setup platform team
        const accountID = account ?? process.env.CDK_DEFAULT_ACCOUNT! ;
        const awsRegion =  region ?? process.env.CDK_DEFAULT_REGION! ;

        const ampWorkspaceName = workspaceName;
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
            true
        );
        doc = blueprints.utils.changeTextBetweenTokens(
            doc,
            "{{ start enableNginxMonJob }}",
            "{{ stop enableNginxMonJob }}",
            true
        );
        doc = blueprints.utils.changeTextBetweenTokens(
            doc,
            "{{ start enableIstioMonJob }}",
            "{{ stop enableIstioMonJob }}",
            true
        );
        doc = blueprints.utils.changeTextBetweenTokens(
            doc,
            "{{ start enableAPIserverJob }}",
            "{{ stop enableAPIserverJob }}",
            true
        );
        doc = blueprints.utils.changeTextBetweenTokens(
            doc,
            "{{ start enableAdotMetricsCollectionJob}}",
            "{{ stop enableAdotMetricsCollectionJob }}",
            true
        );
        doc = blueprints.utils.changeTextBetweenTokens(
            doc,
            "{{ start enableAdotMetricsCollectionTelemetry }}",
            "{{ stop enableAdotMetricsCollectionTelemetry }}",
            true
        );

        fs.writeFileSync(__dirname + '/../common/resources/otel-collector-config-new.yml', doc);

        ampAddOnProps.openTelemetryCollector = {
            manifestPath: __dirname + '/../common/resources/otel-collector-config-new.yml',
            manifestParameterMap: {
                javaScrapeSampleLimit: 1000,
                javaPrometheusMetricsEndpoint: "/metrics"
            }
        };
        ampAddOnProps.enableAPIServerJob = true,
        ampAddOnProps.ampRules?.ruleFilePaths.push(
            __dirname + '/../common/resources/amp-config/java/alerting-rules.yml',
            __dirname + '/../common/resources/amp-config/java/recording-rules.yml',
            __dirname + '/../common/resources/amp-config/apiserver/recording-rules.yml',
            __dirname + '/../common/resources/amp-config/nginx/alerting-rules.yml',
            __dirname + '/../common/resources/amp-config/istio/alerting-rules.yml',
            __dirname + '/../common/resources/amp-config/istio/recording-rules.yml'
        );
        

        return blueprints.ObservabilityBuilder.builder()
            .account(accountID)
            .region(awsRegion)
            // run "eksctl utils describe-addon-versions --kubernetes-version <1.26/1.27/1.28> --name coredns | grep AddonVersion" to find best option
            .withCoreDnsProps({
                version:"v1.9.3-eksbuild.11"
            })
            .withAmpProps(ampAddOnProps)
            .enableOpenSourcePatternAddOns()
            .resourceProvider(ampWorkspaceName, new blueprints.CreateAmpProvider(ampWorkspaceName, ampWorkspaceName))
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
                            {kustomizationPath: "./eks-anywhere-common/Addons/Partner"}, 
                            {kustomizationPath: "./eks-cloud/Partner"}, 
                        ],
                    }],
                }),
                new EksAnywhereSecretsAddon(),
                new blueprints.addons.SSMAgentAddOn(),
                new blueprints.addons.ClusterAutoScalerAddOn()
            );
    }
}


