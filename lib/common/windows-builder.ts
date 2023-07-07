import * as blueprints from '@aws-quickstart/eks-blueprints';
import * as utils from '@aws-quickstart/eks-blueprints/dist/utils';
import { NestedStack, NestedStackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as eks from "aws-cdk-lib/aws-eks";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from 'aws-cdk-lib/aws-iam';
import { NodegroupAmiType } from 'aws-cdk-lib/aws-eks';

export interface WindowsOptions {
    kubernetesVersion: eks.KubernetesVersion,
    instanceClass: ec2.InstanceClass,
    instanceSize: ec2.InstanceSize,
    desiredNodeSize: number,
    minNodeSize: number,
    maxNodeSize: number,
    blockDeviceSize: number,
    clusterProviderTags: {
        [key: string]: string;
    },
    genericNodeGroupTags: {
        [key: string]: string;
    }
    windowsNodeGroupTags: {
        [key: string]: string;
    }
}

export class WindowsBuilder extends blueprints.BlueprintBuilder {

    public addAwsLoadBalancerControllerAddOn(props?: blueprints.AwsLoadBalancerControllerProps) : WindowsBuilder {
        return this.addOns(
            new blueprints.addons.AwsLoadBalancerControllerAddOn(props)
        );
    }

    public static builder(options: WindowsOptions): WindowsBuilder {
        const builder = new WindowsBuilder();

        builder
            .clusterProvider(
                new blueprints.GenericClusterProvider({
                    version: options.kubernetesVersion,
                    tags: options.clusterProviderTags,
                    role: blueprints.getResource(context => {
                        return new iam.Role(context.scope, 'ClusterRole', { 
                            assumedBy: new iam.ServicePrincipal("eks.amazonaws.com"),
                            managedPolicies: [
                                iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonEKSClusterPolicy"),
                                iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonEKSVPCResourceController")
                            ]
                        });
                    }),
                    mastersRole: blueprints.getResource(context => {
                        return new iam.Role(context.scope, 'AdminRole', { assumedBy: new iam.AccountRootPrincipal() });
                    }),
                    managedNodeGroups: [
                        addGenericNodeGroup(options),
                        addWindowsNodeGroup(options)
                    ]
                })
            )
            .addOns(
                new blueprints.NestedStackAddOn({
                    id: "usage-tracking-addon",
                    builder: UsageTrackingAddOn.builder(),
                }),
                new blueprints.addons.CoreDnsAddOn(),
            );
        return builder;
    }
}

/**
 * Nested stack that is used as tracker for Windows Accelerator
 */
export class UsageTrackingAddOn extends NestedStack {

    static readonly USAGE_ID = "qp-1ubotkd2d";

    public static builder(): blueprints.NestedStackBuilder {
        return {
            build(scope: Construct, id: string, props: NestedStackProps) {
                return new UsageTrackingAddOn(scope, id, props);
            }
        };
    }

    constructor(scope: Construct, id: string, props: NestedStackProps) {
        super(scope, id, utils.withUsageTracking(UsageTrackingAddOn.USAGE_ID, props));
    }
}

function addGenericNodeGroup(options: WindowsOptions): blueprints.ManagedNodeGroup {

    return {
        id: "mng-linux",
        amiType: NodegroupAmiType.AL2_X86_64,
        instanceTypes: [new ec2.InstanceType('m5.4xlarge')],
        desiredSize: options.desiredNodeSize,
        minSize: options.minNodeSize, 
        maxSize: options.maxNodeSize,
        nodeRole: blueprints.getNamedResource("node-role") as iam.Role,
        nodeGroupSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        launchTemplate: {
            tags: options.genericNodeGroupTags,
            requireImdsv2: false
        }
    };
}


function addWindowsNodeGroup(options: WindowsOptions): blueprints.ManagedNodeGroup {
    
    const ebsDeviceProps: ec2.EbsDeviceProps = {
        deleteOnTermination: false,
        volumeType: ec2.EbsDeviceVolumeType.GP2
    };

    return {
        id: "mng-windows",
        amiType: NodegroupAmiType.WINDOWS_CORE_2019_X86_64,
        instanceTypes: [new ec2.InstanceType(`${options.instanceClass}.${options.instanceSize}`)],
        desiredSize: options.desiredNodeSize,
        minSize: options.minNodeSize, 
        maxSize: options.maxNodeSize,
        nodeRole: blueprints.getNamedResource("node-role") as iam.Role,
        nodeGroupSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        diskSize: options.blockDeviceSize,
        tags: options.windowsNodeGroupTags,
    };
}