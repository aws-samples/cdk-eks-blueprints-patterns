import 'source-map-support/register';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import * as eks from "aws-cdk-lib/aws-eks";
import { Construct } from 'constructs';
import { dependable } from '@aws-quickstart/eks-blueprints/dist/utils';
import { UpboundCrossplaneAddOn } from './upbound-crossplane-addon';

export class UpboundCrossplaneEKSProviderAddOn implements blueprints.ClusterAddOn {
    id?: string | undefined;
    readonly UpboundEKSProviderVersion: string;
    constructor(UpboundEKSProviderVersion: string) {
        this.UpboundEKSProviderVersion = UpboundEKSProviderVersion;
    }    
    @dependable(UpboundCrossplaneAddOn.name)
    deploy(clusterInfo: blueprints.ClusterInfo): void | Promise<Construct> {
        const cluster = clusterInfo.cluster;
        const crossplaneIRSARole = clusterInfo.getAddOnContexts().get("UpboundCrossplaneAddOn")!["arn"];
        const controllerConfig = new eks.KubernetesManifest(clusterInfo.cluster.stack, "ControllerConfig", {
            cluster: cluster,
            manifest: [
                {
                    apiVersion: "pkg.crossplane.io/v1alpha1",
                    kind: "ControllerConfig",
                    metadata: {
                        name: "aws-config",
                        annotations: {
                            "eks.amazonaws.com/role-arn": crossplaneIRSARole
                        }
                    },
                    spec: {},
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
                        // package: "xpkg.upbound.io/upbound/provider-aws-eks:v1.1.0",
                        package: 'xpkg.upbound.io/upbound/provider-aws-eks:'+this.UpboundEKSProviderVersion,
                        controllerConfigRef: {
                            name: "aws-config"
                        }
                    },
                },
            ],
        });
        
        awsEksProvider.node.addDependency(controllerConfig);
        return Promise.resolve(controllerConfig);
    }
}
