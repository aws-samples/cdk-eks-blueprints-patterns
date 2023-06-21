import * as blueprints from "@aws-quickstart/eks-blueprints";
import { CfnWorkspace } from "aws-cdk-lib/aws-aps";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as eks from "aws-cdk-lib/aws-eks";
import { Construct } from "constructs";
import { LookupHostedZoneProvider, GlobalResources, utils } from '@aws-quickstart/eks-blueprints';

export default class GravitonConstruct {
    async buildAsync(scope: Construct, id: string) {
        const account = process.env.CDK_DEFAULT_ACCOUNT!;
        const region = process.env.CDK_DEFAULT_REGION!;
        const stackID = `${id}-blueprint`;

        const mngProps: blueprints.MngClusterProviderProps = {
            version: eks.KubernetesVersion.of("1.27"),
            instanceTypes: [new ec2.InstanceType("m7g.large")],
            amiType: eks.NodegroupAmiType.AL2_ARM_64,
            desiredSize: 3,
            minSize: 2,
            maxSize: 6,
        };

        const parentDomain = utils.valueFromContext(scope, "parent.hostedzone.name", "mycompany.a2z.com");
        const ampWorkspaceName = "blueprints-amp-workspace";
        const ampWorkspace: CfnWorkspace =
            blueprints.getNamedResource(ampWorkspaceName);

        const addOns: Array<blueprints.ClusterAddOn> = [
            new blueprints.addons.AwsLoadBalancerControllerAddOn(),
            new blueprints.addons.CertManagerAddOn(),
            new blueprints.addons.KubeStateMetricsAddOn(),
            new blueprints.addons.PrometheusNodeExporterAddOn(),
            new blueprints.addons.GrafanaOperatorAddon(),
            new blueprints.addons.SecretsStoreAddOn(),
            new blueprints.addons.ExternalsSecretsAddOn(),
            new blueprints.addons.VpcCniAddOn(),
            new blueprints.addons.MetricsServerAddOn(),
            new blueprints.ExternalDnsAddOn({
                hostedZoneResources: [blueprints.GlobalResources.HostedZone] // you can add more if you register resource providers
            }),
            new blueprints.addons.AdotCollectorAddOn(),
            new blueprints.addons.AmpAddOn({
                ampPrometheusEndpoint: ampWorkspace.attrPrometheusEndpoint,
            }),
            new blueprints.addons.XrayAdotAddOn(),
            new blueprints.addons.KubeProxyAddOn("v1.27.1-eksbuild.1"),
            new blueprints.addons.ClusterAutoScalerAddOn(),
            new blueprints.addons.FluxCDAddOn(),
            new blueprints.addons.CloudWatchLogsAddon({
                logGroupPrefix: "/aws/eks/graviton-blueprint",
            }),
            new blueprints.addons.IstioBaseAddOn(),
            new blueprints.addons.IstioControlPlaneAddOn(),
            new blueprints.addons.CalicoOperatorAddOn(),
            new blueprints.addons.EfsCsiDriverAddOn(),
        ];
        const clusterProvider = new blueprints.MngClusterProvider(mngProps);

        blueprints.EksBlueprint.builder()
            .account(account)
            .region(region)
            .resourceProvider(
                blueprints.GlobalResources.Vpc,
                new blueprints.VpcProvider()
            )
            .resourceProvider(GlobalResources.HostedZone, new LookupHostedZoneProvider(parentDomain))
            .resourceProvider(
                "efs-file-system",
                new blueprints.CreateEfsFileSystemProvider({
                    name: "efs-file-system",
                })
            )
            .resourceProvider(
                ampWorkspaceName,
                new blueprints.CreateAmpProvider(
                    ampWorkspaceName,
                    ampWorkspaceName
                )
            )
            .clusterProvider(clusterProvider)
            .addOns(...addOns)
            .build(scope, stackID);
    }
}
