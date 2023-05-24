import * as blueprints from '@aws-quickstart/eks-blueprints';
import { ServiceAccount } from 'aws-cdk-lib/aws-eks';
import { ManagedPolicy } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';


export interface MyTrivyAddOnProps extends blueprints.addons.HelmAddOnUserProps {
    /**
     * Cloudwatch region where logs are forwarded
     */
    cloudWatchRegion: string;

    /**
     * Optional license key that contains the name of the secret in AWS Secrets Manager to retrieve the secret.
     */
    licenseKeySecret?: string
}


export const defaultProps: blueprints.addons.HelmAddOnProps & MyTrivyAddOnProps = {
    chart: 'aws-for-trivy',
    cloudWatchRegion: 'us-east-1',
    name: 'my-addon',
    namespace: 'kube-system',
    release: 'blueprints-addon-myextension-fluent-bit',
    version: '0.1.11',
    repository: 'https://aws.github.io/eks-charts',
    values: {}
}


export class MyTrivyAddOn extends blueprints.addons.HelmAddOn {

    readonly options: MyTrivyAddOnProps;

    constructor(props: MyTrivyAddOnProps) {
        super({...defaultProps, ...props});
        this.options = this.props as MyTrivyAddOnProps;
    }

    // Declares dependency on secret store add-on if secrets are needed. 
    // Customers will have to explicitly add this add-on to the blueprint.
    @blueprints.utils.dependable(blueprints.SecretsStoreAddOn.name) 
    deploy(clusterInfo: blueprints.ClusterInfo): Promise<Construct> {

        const ns = blueprints.utils.createNamespace(this.props.namespace!, clusterInfo.cluster, true);

        const serviceAccountName = 'aws-for-trivy-sa';
        const sa = clusterInfo.cluster.addServiceAccount('my-aws-for-trivy-sa', {
            name: serviceAccountName,
            namespace: this.props.namespace
        });

        sa.node.addDependency(ns); // signal provisioning to wait for namespace creation to complete 
                                   // before the service account creation is attempted (otherwise can fire in parallel)

        // Cloud Map Full Access policy.
        const cloudWatchAgentPolicy = ManagedPolicy.fromAwsManagedPolicyName("CloudWatchAgentServerPolicy");
        sa.role.addManagedPolicy(cloudWatchAgentPolicy);

        const values: blueprints.Values = {
            serviceAccount: {
                create: false,
                name: serviceAccountName
            },
            cloudWatch: {
                region: this.options.cloudWatchRegion
            }
        };

        let secretProviderClass : blueprints.addons.SecretProviderClass | undefined;
        if(this.options.licenseKeySecret) {
            secretProviderClass = this.setupSecretProviderClass(clusterInfo, sa);
            this.addSecretVolumeAndMount(values);
        }
        
        const chart = this.addHelmChart(clusterInfo, values);
        chart.node.addDependency(sa);

        if(secretProviderClass) { // if secret provider class must be created before the helm chart is applied, add dependenncy to enforce the order
            secretProviderClass.addDependent(chart);
        }

        return Promise.resolve(chart); // returning this promise will enable other add-ons to declare dependency on this addon.
    }

    /**
     * Creates a secret provider class for the specified secret key (licenseKey). 
     * The secret provider class can then be mounted to pods and the secret is made available as the volume mount.
     * The CSI Secret Driver also creates a regular Kubernetes Secret once the secret volume is mounted. That secret
     * is available while at least one pod with the mounted secret volume exists.
     * 
     * @param clusterInfo 
     * @param serviceAccount 
     * @returns 
     */
    private setupSecretProviderClass(clusterInfo: blueprints.ClusterInfo, serviceAccount: ServiceAccount): blueprints.SecretProviderClass {
        const csiSecret: blueprints.addons.CsiSecretProps = {
            secretProvider: new blueprints.LookupSecretsManagerSecretByName(this.options.licenseKeySecret!),
            kubernetesSecret: {
                secretName: this.options.licenseKeySecret!,
                data: [
                    {
                        key: 'licenseKey'
                    }
                ]
            }
        };

       return new blueprints.addons.SecretProviderClass(clusterInfo, serviceAccount, "my-addon-license-secret-class", csiSecret);
    }

    /**
     * Adds secret volume for the specified secret provider class and mount through helm values.
     * Helm support to add volumes and mounts is part of the aws fluentbit helm chart.
     * @param values for the helm chart where volumes and mounts must be added
     */
    private addSecretVolumeAndMount(values: blueprints.Values) {
        blueprints.utils.setPath(values, "volumes", [
            {
                name: "secrets-store-inline",
                csi: {
                    driver: "secrets-store.csi.k8s.io",
                    readOnly: true,
                    volumeAttributes: {
                        secretProviderClass: "my-addon-license-secret-class"
                    }
                }
            }
        ]);
        blueprints.utils.setPath(values, "volumeMounts", [
            {
                name: "secrets-store-inline",
                mountPath: "/mnt/secret-store"
            }
        ]);
    }
}