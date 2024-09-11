import 'source-map-support/register';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import * as eks from "aws-cdk-lib/aws-eks";
import { Construct } from 'constructs';
import { dependable } from '@aws-quickstart/eks-blueprints/dist/utils';
import { UpboundCrossplaneAddOn } from './upbound-crossplane-addon';
import { Policy, PolicyDocument} from 'aws-cdk-lib/aws-iam';

export class UpboundCrossplaneEKSProviderAddOn implements blueprints.ClusterAddOn {
    id?: string | undefined;
    readonly UpboundEKSProviderVersion: string;
    constructor(UpboundEKSProviderVersion: string) {
        this.UpboundEKSProviderVersion = UpboundEKSProviderVersion;
    }    
    @dependable(UpboundCrossplaneAddOn.name)
    deploy(clusterInfo: blueprints.ClusterInfo): void | Promise<Construct> {
        const cluster = clusterInfo.cluster;

        // Create the CrossPlane EKS Provider IRSA.
        const serviceAccountName = "provider-aws-eks";
        const upboundNamespace = "upbound-system";
        const sa = cluster.addServiceAccount(serviceAccountName, {
            name: serviceAccountName,
            namespace: upboundNamespace,
        });
        sa.role.attachInlinePolicy(new Policy(cluster.stack, 'eks-workload-connector-policy',  {
            document: PolicyDocument.fromJson({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": ["sts:AssumeRole"],
                        "Resource": `arn:aws:iam::${cluster.stack.account}:role/eks-workload-connector-role`
                    },
                    {
                        "Effect": "Allow",
                        "Action": ["eks:*"],
                        "Resource": `*`
                    }                
                ]
            })}));

        clusterInfo.addAddOnContext(UpboundCrossplaneEKSProviderAddOn.name, {
            arn: sa.role.roleArn
        });

        const runtimeConfig = new eks.KubernetesManifest(clusterInfo.cluster.stack, "runtimeConfig", {
            cluster: cluster,
            manifest: [
                {
                    apiVersion: "pkg.crossplane.io/v1beta1",
                    kind: "DeploymentRuntimeConfig",
                    metadata: { 
                        name: "aws-eks-runtime-config"               
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
                            metadata: { name: "provider-aws-eks" } 
                        }
                    }
                },
            ],
        });

        const awsEksProvider = new eks.KubernetesManifest(clusterInfo.cluster.stack, "EKSProvider", {
            cluster: cluster,
            manifest: [
                {
                    apiVersion: "pkg.crossplane.io/v1",
                    kind: "Provider",
                    metadata: {
                        name: "provider-aws-eks",
                    },
                    spec: {
                        package: 'xpkg.upbound.io/upbound/provider-aws-eks:'+this.UpboundEKSProviderVersion,
                        runtimeConfigRef: {
                            name: "aws-eks-runtime-config"
                        }                        
                    },
                },
            ],
        });
        
        runtimeConfig.node.addDependency(sa);
        awsEksProvider.node.addDependency(runtimeConfig);
        return Promise.resolve(awsEksProvider);
    }
}
