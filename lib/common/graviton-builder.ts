import * as blueprints from '@aws-quickstart/eks-blueprints';
import * as utils from '@aws-quickstart/eks-blueprints/dist/utils';
import { NestedStack, NestedStackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as eks from "aws-cdk-lib/aws-eks";
import * as ec2 from "aws-cdk-lib/aws-ec2";

export interface GravitonOptions {
    kubernetesVersion: eks.KubernetesVersion,
    instanceClass: ec2.InstanceClass,
    instanceSize: ec2.InstanceSize
}

export class GravitonBuilder extends blueprints.BlueprintBuilder {


    public addIstioBaseAddOn(props?: blueprints.IstioBaseAddOnProps) : GravitonBuilder {
        return this.addOns(
            new blueprints.addons.IstioBaseAddOn(props)
        );
    }

    public addIstioControlPlaneAddOn(props?: blueprints.IstioControlPlaneAddOnProps) : GravitonBuilder {
        return this.addOns(
            new blueprints.addons.IstioControlPlaneAddOn(props)
        );
    }

    public addKubeStateMetricsAddOn(props?: blueprints.KubeStateMetricsAddOnProps) : GravitonBuilder {
        return this.addOns(
            new blueprints.addons.KubeStateMetricsAddOn(props)
        );
    }

    public addMetricsServerAddOn() : GravitonBuilder {
        return this.addOns(
            new blueprints.addons.MetricsServerAddOn()
        );
    }

    public addPrometheusNodeExporterAddOn(props?: blueprints.PrometheusNodeExporterAddOnProps) : GravitonBuilder {
        return this.addOns(
            new blueprints.addons.PrometheusNodeExporterAddOn(props)
        );
    }

    public addExternalsSecretsAddOn(props?: blueprints.ExternalsSecretsAddOnProps) : GravitonBuilder {
        return this.addOns(
            new blueprints.addons.ExternalsSecretsAddOn(props)
        );
    }

    public addSecretsStoreAddOn(props?: blueprints.SecretsStoreAddOnProps) : GravitonBuilder {
        return this.addOns(
            new blueprints.addons.SecretsStoreAddOn(props)
        );
    }

    public addCalicoOperatorAddOn(props?: blueprints.CalicoOperatorAddOnProps) : GravitonBuilder {
        return this.addOns(
            new blueprints.addons.CalicoOperatorAddOn(props)
        );
    }

    public addCertManagerAddOn(props?: blueprints.CertManagerAddOnProps) : GravitonBuilder {
        return this.addOns(
            new blueprints.addons.CertManagerAddOn(props)
        );
    }

    public addAdotCollectorAddOn() : GravitonBuilder {
        return this.addOns(
            new blueprints.addons.AdotCollectorAddOn()
        );
    }

    public addAmpAddOn(props: blueprints.AmpAddOnProps) : GravitonBuilder {
        return this.addOns(
            new blueprints.addons.AmpAddOn(props)
        );
    }

    public addCloudWatchLogsAddOn(props: blueprints.CloudWatchLogsAddonProps) : GravitonBuilder {
        return this.addOns(
            new blueprints.addons.CloudWatchLogsAddon(props)
        );
    }

    public addEfsCsiDriverAddOn(props?: blueprints.EfsCsiDriverProps) : GravitonBuilder {
        return this.addOns(
            new blueprints.addons.EfsCsiDriverAddOn(props)
        );
    } 

    public addFluxCDAddOn(props?: blueprints.FluxCDAddOnProps) : GravitonBuilder {  
        return this.addOns(
            new blueprints.addons.FluxCDAddOn(props)
        );
    }  

    public addGrafanaOperatorAddOn(props?: blueprints.GrafanaOperatorAddonProps) : GravitonBuilder {
        return this.addOns(
            new blueprints.addons.GrafanaOperatorAddon(props)
        );
    }  

    public addXrayAdotAddOn(props?: blueprints.XrayAdotAddOnProps) : GravitonBuilder {
        return this.addOns(
            new blueprints.addons.XrayAdotAddOn(props)
        );
    }

    public static builder(options: GravitonOptions): GravitonBuilder {
        const builder = new GravitonBuilder();

        builder
            .clusterProvider(
                new blueprints.MngClusterProvider({
                    version: options.kubernetesVersion,
                    instanceTypes: [new ec2.InstanceType(`${options.instanceClass}.${options.instanceSize}`)],
                    amiType: eks.NodegroupAmiType.AL2_ARM_64,
                    desiredSize: 3,
                    minSize: 2,
                    maxSize: 6,
                })
            )
            .addOns(
                new blueprints.NestedStackAddOn({
                    id: "usage-tracking-addons",
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

    static readonly USAGE_ID = "qs-1ub15dn1f";

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