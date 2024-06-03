import 'source-map-support/register';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import * as eks from "aws-cdk-lib/aws-eks";
import { Construct } from 'constructs';
import { dependable } from '@aws-quickstart/eks-blueprints/dist/utils';
import { UpboundCrossplaneAddOn } from './upbound-crossplane-addon';

export class CrossplaneK8sProviderAddon implements blueprints.ClusterAddOn {
    id?: string | undefined;
    @dependable(UpboundCrossplaneAddOn.name)
    deploy(clusterInfo: blueprints.ClusterInfo): void | Promise<Construct> {
        const cluster = clusterInfo.cluster;
        
        const role_binding1 = {
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

        const runtime_config1 = {
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

        const providerK8sResource1 = {
            apiVersion: "pkg.crossplane.io/v1",
            kind: "Provider",
            metadata: { name: "kubernetes-provider" },
            spec: {
                package: "xpkg.upbound.io/crossplane-contrib/provider-kubernetes:v0.13.0",
                runtimeConfigRef: {
                    name: "kubernetes-runtime-config"
                }
            }
        };

        const runtimeK8sConfig1 = new eks.KubernetesManifest(clusterInfo.cluster.stack, "runtimeK8sConfig1", {
            cluster: cluster,
            manifest: [role_binding1, runtime_config1]
        });

        const awsK8sProvider1 = new eks.KubernetesManifest(clusterInfo.cluster.stack, "awsK8sProvider1", {
            cluster: cluster,
            manifest: [providerK8sResource1]
        });

        awsK8sProvider1.node.addDependency(runtimeK8sConfig1);

        return Promise.resolve(runtimeK8sConfig1);
    }
}
