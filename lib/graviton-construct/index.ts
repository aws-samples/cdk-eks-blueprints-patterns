import * as blueprints from "@aws-quickstart/eks-blueprints";
import { CfnWorkspace } from "aws-cdk-lib/aws-aps";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as eks from "aws-cdk-lib/aws-eks";
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
            kubernetesVersion: eks.KubernetesVersion.of("1.27"),
            instanceClass: ec2.InstanceClass.M7G,
            instanceSize: ec2.InstanceSize.LARGE
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
            .addIstioBaseAddOn()
            .addIstioControlPlaneAddOn()
            .addMetricsServerAddOn()
            .addKubeStateMetricsAddOn()
            .addPrometheusNodeExporterAddOn()
            .addExternalsSecretsAddOn()
            .addSecretsStoreAddOn()
            .addCalicoOperatorAddOn()
            .addCertManagerAddOn()
            .addAdotCollectorAddOn()
            .addAmpAddOn({
                ampPrometheusEndpoint: ampWorkspace.attrPrometheusEndpoint
            })
            .addCloudWatchLogsAddOn({
                logGroupPrefix: "/aws/eks/graviton-blueprint",
            })
            .addEfsCsiDriverAddOn()
            .addFluxCDAddOn()
            .addGrafanaOperatorAddOn()
            .addXrayAdotAddOn()
            .build(scope, stackID);
    }
}
