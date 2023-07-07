import * as blueprints from "@aws-quickstart/eks-blueprints";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as eks from "aws-cdk-lib/aws-eks";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { WindowsBuilder, WindowsOptions } from '../common/windows-builder';

export default class WindowsConstruct {
    build(scope: Construct, id: string) {
        const account = process.env.CDK_DEFAULT_ACCOUNT!;
        const region = process.env.CDK_DEFAULT_REGION!;
        const stackID = `${id}-eks-blueprint`;

        const nodeRole = new blueprints.CreateRoleProvider("blueprint-node-role", new iam.ServicePrincipal("ec2.amazonaws.com"),
        [
            iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonEKSWorkerNodePolicy"),
            iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonEC2ContainerRegistryReadOnly"),
            iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore")
        ]);

        const options: WindowsOptions = {
            kubernetesVersion: eks.KubernetesVersion.of("1.27"),
            instanceClass: ec2.InstanceClass.M5,
            instanceSize: ec2.InstanceSize.XLARGE4,
            desiredNodeSize: 3,
            minNodeSize: 2,
            maxNodeSize: 4,
            blockDeviceSize: 50,
            clusterProviderTags: {
                "Name": "blueprints-windows-eks-cluster",
                "Type": "generic-windows-cluster"
            },
            launchTemplateTags: {
                "Name": "Managed-Node-Group",
                "Type": "Windows-Node-Group",
                "LaunchTemplate": "WindowsLT",
                "kubernetes.io/cluster/blueprint-construct-dev": "owned"
            }
        };

        WindowsBuilder.builder(options)
            .account(account)
            .region(region)
            .addAwsLoadBalancerControllerAddOn()
            .resourceProvider("node-role", nodeRole)
            .resourceProvider(
                blueprints.GlobalResources.Vpc,
                new blueprints.VpcProvider()
            )
            .build(scope, stackID);
    }
}