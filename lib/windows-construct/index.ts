import * as blueprints from "@aws-quickstart/eks-blueprints";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as eks from "aws-cdk-lib/aws-eks";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { WindowsBuilder, WindowsOptions, WindowsVpcCni } from "@aws-quickstart/eks-blueprints";

export default class WindowsConstruct {
    build(scope: Construct, id: string) {
        const account = process.env.CDK_DEFAULT_ACCOUNT!;
        const region = process.env.CDK_DEFAULT_REGION!;
        const stackID = `${id}-eks-blueprint`;

        const nodeRole = new blueprints.CreateRoleProvider("blueprint-node-role", new iam.ServicePrincipal("ec2.amazonaws.com"),
            [
                iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonEKSWorkerNodePolicy"),
                iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonEC2ContainerRegistryReadOnly"),
                iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore"),
                iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonEKS_CNI_Policy")
            ]);

        const options: WindowsOptions = {
            kubernetesVersion: eks.KubernetesVersion.of("1.27"),
            instanceClass: ec2.InstanceClass.T3,
            instanceSize: ec2.InstanceSize.MEDIUM,
            desiredNodeSize: 1,
            minNodeSize: 1,
            maxNodeSize: 3,
            blockDeviceSize: 50,
            noScheduleForWindowsNodes: true,
            clusterProviderTags: {
                "Name": "blueprints-windows-eks-cluster",
                "Type": "generic-windows-cluster"
            },
            genericNodeGroupTags: {
                "Name": "Mng-linux",
                "kubernetes.io/cluster/windows-eks-blueprint": "owned"
            },
            windowsNodeGroupTags: {
                "Name" : "Mng-windows",
                "kubernetes.io/cluster/windows-eks-blueprint": "owned"
            }
        };

        const karpenterAddon = new blueprints.addons.KarpenterAddOn({
            version: "v0.31.3",
            requirements: [
                { key: 'kubernetes.io/os', op: 'In', vals: ['windows']},
            ],
            subnetTags: {
                "Name": `${stackID}/${stackID}-vpc/Private*`,
            },
            securityGroupTags: {
                [`kubernetes.io/cluster/${stackID}`]: "owned",
            },
            consolidation: { enabled: true },
            ttlSecondsUntilExpired: 2592000,
            weight: 20,
            interruptionHandling: true,
            taints: [
                {
                    key: "os",
                    value: "windows",
                    effect: "NoSchedule"
                }
            ],
            amiFamily: "Windows2022"
        });

        const addOns: Array<blueprints.ClusterAddOn> = [
            new WindowsVpcCni(),
            karpenterAddon
        ];

        WindowsBuilder.builder(options)
            .addOns(...addOns)
            .account(account)
            .region(region)
            .resourceProvider("node-role", nodeRole)
            .resourceProvider(
                blueprints.GlobalResources.Vpc,
                new blueprints.VpcProvider()
            )
            .build(scope, stackID);
    }
}
