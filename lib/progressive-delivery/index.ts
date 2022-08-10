import { Construct } from 'constructs';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import { MeshProviderOptions } from '@aws-quickstart/eks-blueprints';

/**
 * Demonstrates how to use Flagger for progressive delivery.
 */
export default class ProgressiveDemoConstruct {

    build(scope: Construct, id: string) {

        const stackID = `${id}-blueprint`;
        const accountID = process.env.CDK_DEFAULT_ACCOUNT!;

        const repoUrl = 'https://github.com/Eli1123/progressive-delivery-addon-demo.git'

        blueprints.EksBlueprint.builder()
            .account(accountID)
            .region('us-east-2')
            .addOns(
                new blueprints.ArgoCDAddOn({
                    bootstrapRepo: {
                        repoUrl,
                        path: './'
                    },
                    adminPasswordSecretName: "argocd-password",
                    
                }),
                new blueprints.addons.AwsLoadBalancerControllerAddOn(),
                new blueprints.addons.FlaggerAddOn({meshProvider: MeshProviderOptions.NGINX}),
                new blueprints.addons.NginxAddOn({values:
                    {
                        controller: {
                            enableLatencyMetrics: "true"
                        },
                        prometheus: {
                            create: "true"
                        },
                }}),
                new blueprints.ClusterAutoScalerAddOn,
                new blueprints.MetricsServerAddOn,
                )
            .teams()
            .build(scope, stackID);
    }
}