import * as blueprints from "@aws-quickstart/eks-blueprints";
import { CfnWorkspace } from "aws-cdk-lib/aws-aps";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import { GravitonBuilder, GravitonOptions } from '../common/graviton-builder';

export default class GravitonConstruct {
    build(scope: Construct, id: string) {
        const account = process.env.CDK_DEFAULT_ACCOUNT!;
        const region = process.env.CDK_DEFAULT_REGION!;
        const stackID = `${id}-blueprint`;

        const ampWorkspaceName = "graviton-amp-workspace";
        const ampWorkspace: CfnWorkspace =
            blueprints.getNamedResource(ampWorkspaceName);

        const options: GravitonOptions = {
            KubernetesVersion: "1.27",
            instanceFamily: ec2.InstanceClass.M7G,
            addIstioAddons: true,
            addMetricsAddons: true,
            addSecretAddons: true,
            addCalicoAddon: true
        };

        const addOns: Array<blueprints.ClusterAddOn> = [
            new blueprints.addons.CertManagerAddOn(),
            new blueprints.addons.AdotCollectorAddOn(),
            new blueprints.addons.AmpAddOn({
                ampPrometheusEndpoint: ampWorkspace.attrPrometheusEndpoint,
            }),
            new blueprints.addons.CloudWatchLogsAddon({
                logGroupPrefix: "/aws/eks/graviton-blueprint",
            }),
            new blueprints.addons.EfsCsiDriverAddOn(),
            new blueprints.addons.FluxCDAddOn(),
            new blueprints.addons.GrafanaOperatorAddon(),
            new blueprints.addons.XrayAdotAddOn(),
        ];

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
            .addOns(...addOns)
            .build(scope, stackID);
    }
}
