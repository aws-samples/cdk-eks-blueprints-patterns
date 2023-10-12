import * as blueprints from "@aws-quickstart/eks-blueprints";
import { GravitonBuilder } from "@aws-quickstart/eks-blueprints";
import { CfnWorkspace } from "aws-cdk-lib/aws-aps";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as eks from "aws-cdk-lib/aws-eks";
import { Construct } from "constructs";

export default class GravitonConstruct {
    build(scope: Construct, id: string) {
        const account = process.env.CDK_DEFAULT_ACCOUNT!;
        const region = process.env.CDK_DEFAULT_REGION!;
        const stackID = `${id}-blueprint`;

        const ampWorkspaceName = "graviton-amp-workspaces";
        const ampWorkspace: CfnWorkspace =
            blueprints.getNamedResource(ampWorkspaceName);

        const options: Partial<blueprints.MngClusterProviderProps> = {
            version: eks.KubernetesVersion.of("1.27"),
            instanceTypes: [ec2.InstanceType.of(ec2.InstanceClass.M7G, ec2.InstanceSize.XLARGE)],
            desiredSize: 3,
            minSize: 2,
            maxSize: 5,
        };

        GravitonBuilder.builder(options)
            .account(account)
            .region(region)
            .resourceProvider(
                blueprints.GlobalResources.Vpc,
                new blueprints.VpcProvider()
            )
            .resourceProvider(
                "efs-file-system",
                new blueprints.CreateEfsFileSystemProvider({
                    name: "efs-file-systems",
                })
            )
            .resourceProvider(
                ampWorkspaceName,
                new blueprints.CreateAmpProvider(
                    ampWorkspaceName,
                    ampWorkspaceName
                )
            )
            .addOns(
                new blueprints.addons.IstioBaseAddOn(),
                new blueprints.addons.IstioControlPlaneAddOn(),
                new blueprints.addons.KubeStateMetricsAddOn(),
                new blueprints.addons.MetricsServerAddOn(),
                new blueprints.addons.PrometheusNodeExporterAddOn(),
                new blueprints.addons.ExternalsSecretsAddOn(),
                new blueprints.addons.SecretsStoreAddOn(),
                new blueprints.addons.CalicoOperatorAddOn(),
                new blueprints.addons.CertManagerAddOn(),
                new blueprints.addons.AdotCollectorAddOn(),
                new blueprints.addons.AmpAddOn({
                    ampPrometheusEndpoint: ampWorkspace.attrPrometheusEndpoint
                }),
                new blueprints.addons.CloudWatchLogsAddon({
                    logGroupPrefix: "/aws/eks/graviton-blueprint",
                }),
                new blueprints.addons.EfsCsiDriverAddOn(),
                new blueprints.addons.FluxCDAddOn(),
                new blueprints.addons.GrafanaOperatorAddon(),
                new blueprints.addons.XrayAdotAddOn()
            )
            .build(scope, stackID);
    }
}