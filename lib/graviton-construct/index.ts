import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as eks from "aws-cdk-lib/aws-eks";
import * as blueprints from "@aws-quickstart/eks-blueprints";
import { DatadogAddOn } from "@datadog/datadog-eks-blueprints-addon";

export default class GravitonConstruct {
    build(scope: Construct, id: string) {
        const account = process.env.CDK_DEFAULT_ACCOUNT!;
        const region = process.env.CDK_DEFAULT_REGION!;
        const stackID = `${id}-blueprint`;

        const mngProps: blueprints.MngClusterProviderProps = {
            version: eks.KubernetesVersion.V1_26,
            instanceTypes: [new ec2.InstanceType("m7g.large")],
            amiType: eks.NodegroupAmiType.AL2_ARM_64,
            desiredSize: 3,
            minSize: 2,
            maxSize: 6,
        };

        const addOns: Array<blueprints.ClusterAddOn> = [
            new blueprints.addons.AwsLoadBalancerControllerAddOn(),
            new blueprints.addons.KubeProxyAddOn(),
            new blueprints.addons.ClusterAutoScalerAddOn(),
            new blueprints.addons.SecretsStoreAddOn(),
            new blueprints.addons.VpcCniAddOn(),
            new blueprints.addons.KubeStateMetricsAddOn(),
            new blueprints.addons.MetricsServerAddOn(),
            new blueprints.addons.CloudWatchLogsAddon({
                logGroupPrefix: "/aws/eks/graviton-blueprint",
            }),
            new DatadogAddOn({
                apiKeyAWSSecret: "<secret-name-in-aws-secret-manager>", //preferred
                apiKeyExistingSecret: "<kubernetes-secret-name>",
                apiKey: "<api-key>", //insecure
            }),
            new blueprints.addons.VeleroAddOn(),
            new blueprints.addons.ContainerInsightsAddOn(),
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
            .resourceProvider(
                "efs-file-system",
                new blueprints.CreateEfsFileSystemProvider({
                    name: "efs-file-system",
                })
            )
            .clusterProvider(clusterProvider)
            .addOns(...addOns)
            .build(scope, stackID);
    }
}
