import { Construct } from 'constructs';

// Blueprints Lib
import * as blueprints from '@aws-quickstart/eks-blueprints';
import * as amp from 'aws-cdk-lib/aws-aps';
import { EksAnywhereSecretsAddon } from './eksa-secret-stores';


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
        const ampPrometheusEndpoint = (blueprints.getNamedResource(ampWorkspaceName) as unknown as amp.CfnWorkspace).attrPrometheusEndpoint;

        return blueprints.ObservabilityBuilder.builder()
            .account(accountID)
            .region(awsRegion)
            .enableOpenSourcePatternAddOns()
            .withAmpProps({
                ampPrometheusEndpoint: ampPrometheusEndpoint,
            })
            .resourceProvider(ampWorkspaceName, new blueprints.CreateAmpProvider(ampWorkspaceName, ampWorkspaceName))
            .addOns(
                new blueprints.addons.FluxCDAddOn({
                  version:"2.2.3",
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
                           {kustomizationPath: "./eks-anywhere-common/Addons/Core"},
                           {kustomizationPath: "./eks-anywhere-common/Addons/Partner"}, 
                           {kustomizationPath: "./eks-cloud/Partner"}, 
                       ],
                  }],
                }),
                new EksAnywhereSecretsAddon()
            )
    }
}


