import * as blueprints from "@aws-quickstart/eks-blueprints";
import { CfnWorkspace } from "aws-cdk-lib/aws-aps";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as eks from "aws-cdk-lib/aws-eks";
import { Construct } from "constructs";
import { GravitonBuilder } from '../common/graviton-builder';

export default class GravitonConstruct {
    build(scope: Construct, id: string) {
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

        const ampWorkspaceName = "graviton-amp-workspace";
        const ampWorkspace: CfnWorkspace =
            blueprints.getNamedResource(ampWorkspaceName);

        const addOns: Array<blueprints.ClusterAddOn> = [
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
        const clusterProvider = new blueprints.MngClusterProvider(mngProps);

        GravitonBuilder.builder()
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
            .clusterProvider(clusterProvider)
            .addOns(...addOns)
            .build(scope, stackID);
    }
}
