import { Construct } from 'constructs';

// Blueprints Lib
import * as blueprints from '@aws-quickstart/eks-blueprints';
import { ClusterSecretStoreAddon } from './cluster-secret-store-addon';


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
        
        const ampEndpoint = blueprints.utils.valueFromContext(scope, "conformitron.amp.endpoint", "https://aps-workspaces.<region>.amazonaws.com/workspaces/<workspace-id>/");

        const ampAddOnProps: blueprints.AmpAddOnProps = {
            ampPrometheusEndpoint: ampEndpoint,
        };

        ampAddOnProps.openTelemetryCollector = {
            manifestPath: __dirname + '/resources/otel-collector-config-new.yml',
            manifestParameterMap: {
                logGroupName: `/aws/eks/conformitron/cluster`,
                logStreamName: `$NODE_NAME`,
                logRetentionDays: 30,
                awsRegion: region 
            }
        };
        
        

        return blueprints.ObservabilityBuilder.builder()
            .account(accountID)
            .region(awsRegion)
            .withAmpProps(ampAddOnProps)
            .enableOpenSourcePatternAddOns()
            .addOns(
                new blueprints.addons.FluxCDAddOn({
                    repositories:[{
                        name: "eks-cloud-addons-conformance",
                        namespace: "flux-system",
                        repository: {
                            repoUrl: 'https://github.com/aws-samples/eks-anywhere-addons',
                            targetRevision: "developer_branch",
                        },
                        values: {
                        },
                        kustomizations: [
                            {kustomizationPath: "./eks-anywhere-common/Addons/Core/Botkube"},
                            {kustomizationPath: "./eks-anywhere-common/Addons/Core/Kube-Observer"},
                            {kustomizationPath: "./eks-anywhere-common/Testers/"},
                            {kustomizationPath: "./eks-cloud/Testers"},
                            {kustomizationPath: "./eks-anywhere-common/Addons/Partner"}, 
                            {kustomizationPath: "./eks-cloud/Partner"}, 
                        ],
                    }],
                }),
                new ClusterSecretStoreAddon(),
                new blueprints.addons.EbsCsiDriverAddOn(),
                new blueprints.addons.ClusterAutoScalerAddOn()
            );
    }
}


