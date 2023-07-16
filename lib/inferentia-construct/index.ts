import * as ec2 from "aws-cdk-lib/aws-ec2";
import { KubernetesVersion, NodegroupAmiType } from 'aws-cdk-lib/aws-eks';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from "constructs";
import * as blueprints from '@aws-quickstart/eks-blueprints';

export default class InferentiaConstruct {
    constructor(scope: Construct, id: string) {
        const account = process.env.CDK_DEFAULT_ACCOUNT!;
        const region = process.env.CDK_DEFAULT_REGION!;
        const stackID = `${id}-blueprint`;

        const nodeRole = new blueprints.CreateRoleProvider("blueprint-node-role", new iam.ServicePrincipal("ec2.amazonaws.com"),
            [
                iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonEKSWorkerNodePolicy"),
                iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonEC2ContainerRegistryReadOnly"),
                iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore"),
                iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonS3ReadOnlyAccess")
            ]
        );

        const addOns: Array<blueprints.ClusterAddOn> = [
            new blueprints.addons.AwsLoadBalancerControllerAddOn(),
            new blueprints.addons.ClusterAutoScalerAddOn(),
            new blueprints.addons.VpcCniAddOn(),
            new blueprints.addons.CoreDnsAddOn(),
            new blueprints.addons.KubeProxyAddOn(),
            new blueprints.SSMAgentAddOn()
        ];

        const clusterProvider = new blueprints.GenericClusterProvider({
            version: KubernetesVersion.V1_25,
            tags: {
                "Name": `${id}-cluster`,
                "Type": "neuron-cluster"
            },
            mastersRole: blueprints.getResource(context => {
                return new iam.Role(context.scope, 'AdminRole', { assumedBy: new iam.AccountRootPrincipal() });
            }),
            managedNodeGroups: [
                addGPUNodeGroup(),
            ]
        });

        blueprints.EksBlueprint.builder()
            .account(account)
            .region(region)
            .addOns(...addOns)
            .resourceProvider("node-role", nodeRole)
            .clusterProvider(clusterProvider)
            .teams()
            .build(scope, stackID);
    }
}

function addGPUNodeGroup(): blueprints.ManagedNodeGroup {

    return {
        id: "ng-gpu-inf1",
        amiType: NodegroupAmiType.AL2_X86_64_GPU,
        instanceTypes: [new ec2.InstanceType('inf1.2xlarge')],
        desiredSize: 2,
        minSize: 1,
        maxSize: 4, 
        nodeRole: blueprints.getNamedResource("node-role") as iam.Role,
        nodeGroupSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        diskSize: 40,
    };
}