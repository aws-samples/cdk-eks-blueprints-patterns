import 'source-map-support/register';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import * as eks from "aws-cdk-lib/aws-eks";
import { Construct } from 'constructs';
import { dependable } from '@aws-quickstart/eks-blueprints/dist/utils';
import { UpboundCrossplaneAddOn } from './upbound-crossplane-addon';

export class CrossplaneHelmProviderAddon implements blueprints.ClusterAddOn {
    id?: string | undefined;
    @dependable(UpboundCrossplaneAddOn.name)
    deploy(clusterInfo: blueprints.ClusterInfo): void | Promise<Construct> {
        const cluster = clusterInfo.cluster;

        const role_binding = {
            apiVersion: "rbac.authorization.k8s.io/v1",
            kind: "ClusterRoleBinding",
            metadata: { 
                name: "helm-provider"             
            },
            subjects: [
                {
                    kind: "ServiceAccount",
                    name: "helm-provider",
                    namespace: "upbound-system"
                }
            ],
            roleRef: {
                kind: "ClusterRole",
                name: "cluster-admin",
                apiGroup: "rbac.authorization.k8s.io"
            }
        };

        const runtime_config = {
            apiVersion: "pkg.crossplane.io/v1beta1",
            kind: "DeploymentRuntimeConfig",
            metadata: { 
                name: "helm-runtime-config"               
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
                    metadata: { name: "helm-provider" } 
                }
            }
        };

        const provider = {
            apiVersion: "pkg.crossplane.io/v1",
            kind: "Provider",
            metadata: { name: "helm-provider" },
            spec: {
                package: "xpkg.upbound.io/crossplane-contrib/provider-helm:v0.18.1",
                runtimeConfigRef: {
                    name: "helm-runtime-config"
                }
            }
        };

        const runtimeHelmConfig = new eks.KubernetesManifest(clusterInfo.cluster.stack, "runtimeHelmConfig", {
            cluster: cluster,
            manifest: [role_binding, runtime_config]
        });

        const awsHelmProvider = new eks.KubernetesManifest(clusterInfo.cluster.stack, "providerHelmResource", {
            cluster: cluster,
            manifest: [provider]
        });

        awsHelmProvider.node.addDependency(runtimeHelmConfig);
        return Promise.resolve(runtimeHelmConfig);
    }
}
