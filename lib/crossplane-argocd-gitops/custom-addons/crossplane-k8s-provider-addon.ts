import 'source-map-support/register';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import * as eks from "aws-cdk-lib/aws-eks";
import { Construct } from 'constructs';
import { dependable } from '@aws-quickstart/eks-blueprints/dist/utils';
import { UpboundCrossplaneAddOn } from './upbound-crossplane-addon';

export class CrossplaneK8sProviderAddon implements blueprints.ClusterAddOn {
    id?: string | undefined;
    readonly k8sProviderVersion: string;
    constructor(k8sProviderVersion: string) {
        this.k8sProviderVersion = k8sProviderVersion;
    }

    @dependable(UpboundCrossplaneAddOn.name)
    deploy(clusterInfo: blueprints.ClusterInfo): void | Promise<Construct> {
        const cluster = clusterInfo.cluster;

        const roleBinding = {
            apiVersion: "rbac.authorization.k8s.io/v1",
            kind: "ClusterRoleBinding",
            metadata: { name: "kubernetes-provider" },
            subjects: [
                {
                    kind: "ServiceAccount",
                    name: "kubernetes-provider",
                    namespace: "upbound-system"
                }
            ],
            roleRef: {
                kind: "ClusterRole",
                name: "cluster-admin",
                apiGroup: "rbac.authorization.k8s.io"
            }
        };

        const runtimeConfig = {
            apiVersion: "pkg.crossplane.io/v1beta1",
            kind: "DeploymentRuntimeConfig",
            metadata: { 
                name: "kubernetes-runtime-config"              
            },
            spec: {
                deploymentTemplate: {
                    spec: { 
                        replicas: 1,
                        selector: {},
                        template: {}
                    }
                },
                serviceAccountTemplate: { 
                    metadata: { name: "kubernetes-provider" } 
                }
            }
        };

        const providerK8sResource = {
            apiVersion: "pkg.crossplane.io/v1",
            kind: "Provider",
            metadata: { name: "kubernetes-provider" },
            spec: {
                package: 'xpkg.upbound.io/crossplane-contrib/provider-kubernetes:'+this.k8sProviderVersion,
                runtimeConfigRef: {
                    name: "kubernetes-runtime-config"
                }
            }
        };

        const runtimeK8sConfig = new eks.KubernetesManifest(clusterInfo.cluster.stack, "runtimeK8sConfig", {
            cluster: cluster,
            manifest: [roleBinding, runtimeConfig]
        });

        const awsK8sProvider = new eks.KubernetesManifest(clusterInfo.cluster.stack, "awsK8sProvider", {
            cluster: cluster,
            manifest: [providerK8sResource]
        });

        awsK8sProvider.node.addDependency(runtimeK8sConfig);

        return Promise.resolve(awsK8sProvider);
    }
}
