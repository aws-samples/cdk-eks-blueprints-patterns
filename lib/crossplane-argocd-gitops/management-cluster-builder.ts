import { Construct } from 'constructs';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import * as eks from 'aws-cdk-lib/aws-eks';
import { ObservabilityBuilder } from '@aws-quickstart/eks-blueprints';
import { UpboundCrossplaneAddOn } from './custom-addons/upbound-crossplane-addon';
import  { CrossplaneK8sProviderAddon } from './custom-addons/crossplane-k8s-provider-addon';
import  { CrossplaneHelmProviderAddon } from './custom-addons/crossplane-helm-provider-addon';

const gitUrl = 'https://github.com/aws-samples/eks-blueprints-workloads.git';
const k8sProviderVersion = 'v0.13.0';

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
            new CrossplaneK8sProviderAddon(k8sProviderVersion),
            new CrossplaneHelmProviderAddon,
            new blueprints.SecretsStoreAddOn,
            new blueprints.ArgoCDAddOn({
                bootstrapRepo: {
                    repoUrl: gitUrl,
                    path: `./crossplane-arocd-gitops/envs/dev`,
                    targetRevision: 'main',
                    credentialsSecretName: 'github-token',
                    credentialsType: 'TOKEN'
                }
            }),
        ];

        const clusterProvider = new blueprints.MngClusterProvider({...mngProps,
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
