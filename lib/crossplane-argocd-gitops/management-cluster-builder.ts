import { Construct } from 'constructs';
import { utils } from '@aws-quickstart/eks-blueprints';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import * as eks from 'aws-cdk-lib/aws-eks';
import { ObservabilityBuilder } from '@aws-quickstart/eks-blueprints';
import { UpboundCrossplaneAddOn } from './custom-addons/upbound-crossplane-addon';
import  { CrossplaneAwsProviderAddon } from './custom-addons/crossplane-aws-provider-addon';
import  { CrossplaneK8sProviderAddon } from './custom-addons/crossplane-k8s-provider-addon';
import  { CrossplaneHelmProviderAddon } from './custom-addons/crossplane-helm-provider-addon';


export default class ManagementClusterBuilder {
    readonly account: string;
    readonly region: string;

    constructor(account: string,region: string) {
        this.account = account;
        this.region = region;
    }

    create(scope: Construct, id: string, mngProps: blueprints.MngClusterProviderProps) {
        blueprints.HelmAddOn.validateHelmVersions = false;

        const addOns: Array<blueprints.ClusterAddOn> = [
            new blueprints.addons.ExternalsSecretsAddOn,
            new UpboundCrossplaneAddOn,
            new CrossplaneAwsProviderAddon,
            new CrossplaneK8sProviderAddon,
            new CrossplaneHelmProviderAddon,
            new blueprints.SecretsStoreAddOn,
            new blueprints.ArgoCDAddOn({
                bootstrapRepo: {
                    repoUrl: "https://github.com/aws-samples/eks-blueprints-workloads",
                    path: `./crossplane-arocd-gitops/bootstrap`,
                    targetRevision: 'main',
                    credentialsSecretName: 'github-token',
                    credentialsType: 'TOKEN'
                }
            }),
        ];

        const clusterProvider = new blueprints.MngClusterProvider({...mngProps,
            tags: {"scope": "addon"},
            clusterName:id
        });

        return ObservabilityBuilder.builder()
            .clusterProvider(clusterProvider)
            .version(eks.KubernetesVersion.V1_28)
            .enableNativePatternAddOns()
            .enableControlPlaneLogging()
            .addOns(...addOns);
    }
}
