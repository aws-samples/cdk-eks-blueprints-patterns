import * as blueprints from '@aws-quickstart/eks-blueprints';
import * as utils from '@aws-quickstart/eks-blueprints/dist/utils';
import { NestedStack, NestedStackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class GravitonBuilder {

    public static builder(): blueprints.BlueprintBuilder {
        return new blueprints.BlueprintBuilder()
            .addOns(
                new blueprints.NestedStackAddOn({
                    id: "usage-tracking-addon",
                    builder: UsageTrackingAddOn.builder(),
                }),
                new blueprints.addons.AwsLoadBalancerControllerAddOn(),
                new blueprints.addons.CalicoOperatorAddOn(),
                new blueprints.addons.CertManagerAddOn(),
                new blueprints.addons.ClusterAutoScalerAddOn(),
                new blueprints.addons.ExternalsSecretsAddOn(),
                new blueprints.addons.IstioBaseAddOn(),
                new blueprints.addons.IstioControlPlaneAddOn(),
                new blueprints.addons.KubeProxyAddOn("v1.27.1-eksbuild.1"),
                new blueprints.addons.KubeStateMetricsAddOn(),
                new blueprints.addons.MetricsServerAddOn(),
                new blueprints.addons.PrometheusNodeExporterAddOn(),
                new blueprints.addons.SecretsStoreAddOn(),
                new blueprints.addons.VpcCniAddOn(),
        );
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
