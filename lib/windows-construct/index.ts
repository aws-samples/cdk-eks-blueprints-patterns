import * as blueprints from "@aws-quickstart/eks-blueprints";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as eks from "aws-cdk-lib/aws-eks";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { WindowsBuilder, WindowsOptions, KarpenterAddOnProps } from "@aws-quickstart/eks-blueprints";
import { WindowsVpcCni } from "./vpc-cni";

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
            kubernetesVersion: eks.KubernetesVersion.V1_29,
            instanceClass: ec2.InstanceClass.T3,
            instanceSize: ec2.InstanceSize.MEDIUM,
            desiredNodeCount: 1,
            minNodeSize: 1,
            maxNodeSize: 3,
            blockDeviceSize: 50,
            noScheduleForWindowsNodes: true,
            clusterProviderTags: {
                "Name": "blueprints-windows-eks-cluster",
                "Type": "generic-windows-cluster"
            },
            genericNodeGroupOptions: {
                nodegroupName: "Mng-linux",
                tags: {
                    "kubernetes.io/cluster/windows-eks-blueprint": "owned"
                }
            },
            windowsNodeGroupOptions: {
                nodegroupName: "Mng-windows",
                tags: {
                    "kubernetes.io/cluster/windows-eks-blueprint": "owned"
                }
            }
        };

        const addOns: Array<blueprints.ClusterAddOn> = [
            new WindowsVpcCni(),
        ];

        const karpenterProps :KarpenterAddOnProps = {
            nodePoolSpec: {
                requirements: [
                    { key: 'kubernetes.io/os', operator: 'In', values: ['windows']},
                ],
                taints: [
                    {
                        key: "os",
                        value: "windows",
                        effect: "NoSchedule"
                    }
                ],
                disruption: {
                    consolidationPolicy: "WhenEmpty",
                    consolidateAfter: "300s",
                    expireAfter: "2592000s"
                },
                weight: 20
            },
            ec2NodeClassSpec : {
                subnetSelectorTerms: [
                    { tags:  { "Name": `${stackID}/${stackID}-vpc/Private*` }}
                ],
                securityGroupSelectorTerms: [
                    {tags: { [`kubernetes.io/cluster/${stackID}`]: "owned",}}
                ],
                amiFamily: "Windows2022"
            },
        };

        WindowsBuilder.builder(options)
            .addOns(...addOns)
            .account(account)
            .region(region)
            .withKarpenterProps(karpenterProps)
            .enableKarpenter()
            .resourceProvider("node-role", nodeRole)
            .resourceProvider(
                blueprints.GlobalResources.Vpc,
                new blueprints.VpcProvider()
            )
            .build(scope, stackID);
    }
}
