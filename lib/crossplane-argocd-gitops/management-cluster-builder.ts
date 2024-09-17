import { Construct } from 'constructs';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import * as eks from 'aws-cdk-lib/aws-eks';
import { ObservabilityBuilder } from '@aws-quickstart/eks-blueprints';
import { UpboundCrossplaneAddOn } from './custom-addons/upbound-crossplane-addon';
import  { UpboundCrossplaneEKSProviderAddOn } from './custom-addons/upbound-crossplane-eks-provider-addon';
import  { CrossplaneK8sProviderAddon } from './custom-addons/crossplane-k8s-provider-addon';
import  { CrossplaneHelmProviderAddon } from './custom-addons/crossplane-helm-provider-addon';
// import { TeamSpoc } from './custom-addons/secret-provider-secret';


const gitUrl = 'https://github.com/ajpaws/eks-blueprints-workloads.git';
const k8sProviderVersion = 'v0.13.0';
const UpboundEKSProviderVersion = 'v1.1.0';
const helmProviderVersion = 'v0.19.0';


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
            new UpboundCrossplaneEKSProviderAddOn(UpboundEKSProviderVersion),
            new CrossplaneK8sProviderAddon(k8sProviderVersion),
            new CrossplaneHelmProviderAddon(helmProviderVersion),
            new blueprints.SecretsStoreAddOn,
            new blueprints.ArgoCDAddOn({
                bootstrapRepo: {
                    repoUrl: gitUrl,
                    path: `./crossplane-argocd-gitops/envs/dev`,
                    targetRevision: 'main'
                },
                bootstrapValues: {
                    clusterA: {
                        clusterName: 'workload-amd-1-29-blueprint'
                    },
                    clusterB: {
                        clusterName: 'workload-arm-1-29-blueprint'
                    },
                    common: {
                        providerConfigAWSName: 'common-provider-config-aws',
                        eksConnectorRoleName: 'eks-workload-connector-role',
                        accountId: `${process.env.CDK_DEFAULT_ACCOUNT}`, 
                        region: `${process.env.CDK_DEFAULT_REGION}`,
                        crossplaneNamespace: 'upbound-system'                     
                    }                
                },
            }),
        ];

        const clusterProvider = new blueprints.MngClusterProvider({...mngProps,
            clusterName:id
        });

        return ObservabilityBuilder.builder()
            .clusterProvider(clusterProvider)
            .version(eks.KubernetesVersion.V1_29)
            .enableNativePatternAddOns()
            .enableControlPlaneLogging()
            .addOns(...addOns);
    }
}


