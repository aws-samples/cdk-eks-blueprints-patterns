import * as blueprints from '@aws-quickstart/eks-blueprints';
import * as utils from '@aws-quickstart/eks-blueprints/dist/utils';
import { NestedStack, NestedStackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as eks from "aws-cdk-lib/aws-eks";
import * as ec2 from "aws-cdk-lib/aws-ec2";

export interface GravitonOptions {
    KubernetesVersion: string,
    instanceClass: ec2.InstanceClass,
    instanceSize: ec2.InstanceSize,
    addIstioAddons: boolean,
    addMetricsAddons: boolean,
    addSecretAddons: boolean,
    addCalicoAddon: boolean
}

export class GravitonBuilder extends blueprints.BlueprintBuilder {

    public static builder(options: GravitonOptions): GravitonBuilder {
        const builder = new GravitonBuilder();

        if (options.addIstioAddons) {
            builder.addOns(
                new blueprints.addons.IstioBaseAddOn(),
                new blueprints.addons.IstioControlPlaneAddOn(),
            );
        }

        if (options.addMetricsAddons) {
            builder.addOns(
                new blueprints.addons.KubeStateMetricsAddOn(),
                new blueprints.addons.MetricsServerAddOn(),
                new blueprints.addons.PrometheusNodeExporterAddOn(),
            );
        }

        if (options.addSecretAddons) {
            builder.addOns(
                new blueprints.addons.ExternalsSecretsAddOn(),
                new blueprints.addons.SecretsStoreAddOn(),
            );
        }

        if (options.addCalicoAddon) {
            builder.addOns(
                new blueprints.addons.CalicoOperatorAddOn(),
            );
        }
        
        builder
            .clusterProvider(
                new blueprints.MngClusterProvider({
                    version: eks.KubernetesVersion.of(options.KubernetesVersion),
                    instanceTypes: [new ec2.InstanceType(`${options.instanceClass}.${options.instanceSize}`)],
                    amiType: eks.NodegroupAmiType.AL2_ARM_64,
                    desiredSize: 3,
                    minSize: 2,
                    maxSize: 6,
                })
            )
            .addOns(
                new blueprints.NestedStackAddOn({
                    id: "usage-tracking-addon",
                    builder: UsageTrackingAddOn.builder(),
                }),
                new blueprints.addons.AwsLoadBalancerControllerAddOn(),
                new blueprints.addons.ClusterAutoScalerAddOn(),
                new blueprints.addons.KubeProxyAddOn("v1.27.1-eksbuild.1"),
                new blueprints.addons.VpcCniAddOn(),
            );
        return builder;
    }
}

/**
 * Nested stack that is used as tracker for Graviton Accelerator
 */
export class UsageTrackingAddOn extends NestedStack {

    static readonly USAGE_ID = "qp-1ub15bkuc";

    public static builder(): blueprints.NestedStackBuilder {
        return {
            build(scope: Construct, id: string, props: NestedStackProps) {
                return new UsageTrackingAddOn(scope, id, props);
            }
        };
    }

    constructor(scope: Construct, id: string, props: NestedStackProps) {
        super(scope, id, utils.withUsageTracking(UsageTrackingAddOn.USAGE_ID, props));
    }
}