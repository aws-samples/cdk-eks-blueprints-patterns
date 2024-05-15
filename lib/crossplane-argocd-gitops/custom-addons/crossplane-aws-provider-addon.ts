import 'source-map-support/register';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import * as eks from "aws-cdk-lib/aws-eks";
import { Construct } from 'constructs';
import { dependable } from '@aws-quickstart/eks-blueprints/dist/utils';
import { UpboundCrossplaneAddOn } from './upbound-crossplane-addon';

export class CrossplaneAwsProviderAddon implements blueprints.ClusterAddOn {
    id?: string | undefined;
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
                        package: "xpkg.upbound.io/upbound/provider-aws-eks:v1.1.0",
                        controllerConfigRef: {
                            name: "aws-config"
                        }
                    },
                },
            ],
        });
        
        awsEksProvider.node.addDependency(controllerConfig);

        // const cfnWaitConditionHandle = new cloudformation.CfnWaitConditionHandle(clusterInfo.cluster.stack, 'MyCfnWaitConditionHandle');

        // new cloudformation.CfnWaitCondition(clusterInfo.cluster.stack, "EKSProviderWaitCondition", {
        //     count: 1,
        //     handle: cfnWaitConditionHandle.ref,
        //     timeout: "120",
        // }).node.addDependency(awsEksProvider);

        // const eksProviderConfig = new eks.KubernetesManifest(clusterInfo.cluster.stack, "EKSProviderConfig", {
        //     cluster: cluster,
        //     manifest: [
        //         {
        //             apiVersion: "aws.upbound.io/v1beta1",
        //             kind: "ProviderConfig",
        //             metadata: {
        //                 name: "default",
        //             },
        //             spec: {
        //                 credentials: {
        //                     source: "IRSA"
        //                 }
        //             },
        //         },
        //     ],
        // });

        // eksProviderConfig.node.addDependency(awsEksProvider);
        return Promise.resolve(controllerConfig);
    }
}
