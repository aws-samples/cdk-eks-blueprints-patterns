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
    noScheduleForWindowsNodes: boolean,
    clusterProviderTags: {
        [key: string]: string;
    },
    genericNodeGroupOptions: blueprints.ManagedNodeGroup
    windowsNodeGroupOptions: blueprints.ManagedNodeGroup
}

export class WindowsBuilder extends blueprints.BlueprintBuilder {

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
                    managedNodeGroups: [
                        addGenericNodeGroup(options, options.genericNodeGroupOptions),
                        addWindowsNodeGroup(options),
                    ]
                })
            )
            .addOns(
                new blueprints.NestedStackAddOn({
                    id: "usage-tracking-addon",
                    builder: UsageTrackingAddOn.builder(),
                })
            );
        return builder;
    }
}

/**
 * Nested stack that is used as tracker for Windows Accelerator
 */
export class UsageTrackingAddOn extends NestedStack {

    static readonly USAGE_ID = "qs-1ubotj5kl";

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

function getInstanceType(options: WindowsOptions, nodegroup: blueprints.ManagedNodeGroup): ec2.InstanceType[] {

    if ( nodegroup.instanceTypes ) { return nodegroup.instanceTypes; }

    if ( options.instanceClass && options.instanceSize )
        return [ new ec2.InstanceType(`${options.instanceClass}.${options.instanceSize}`) ];

    return [ new ec2.InstanceType('m5.4xlarge')];
}

function addGenericNodeGroup(options: WindowsOptions, overrideOptions: blueprints.ManagedNodeGroup): blueprints.ManagedNodeGroup {

    return {
        id: overrideOptions.id,
        amiType: overrideOptions.amiType ?? NodegroupAmiType.AL2_X86_64,
        instanceTypes: getInstanceType(options, overrideOptions),
        desiredSize: overrideOptions.desiredSize ?? options.desiredNodeSize,
        minSize: overrideOptions.minSize ?? options.minNodeSize,
        maxSize: overrideOptions.maxSize ?? options.maxNodeSize,
        nodeRole: overrideOptions.nodeRole ?? blueprints.getNamedResource("node-role") as iam.Role,
        nodeGroupSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        tags: overrideOptions.tags,
        launchTemplate: overrideOptions.launchTemplate
    };
}

function addWindowsNodeGroup(options: WindowsOptions): blueprints.ManagedNodeGroup {

    if (options.windowsNodeGroupOptions.amiType == null) { options.windowsNodeGroupOptions.amiType = NodegroupAmiType.WINDOWS_CORE_2022_X86_64; }
    const result = addGenericNodeGroup(options, options.windowsNodeGroupOptions);

    if(options.noScheduleForWindowsNodes) {
        blueprints.utils.setPath(result, "taints", [
            {
                key: "os",
                value: "windows",
                effect: eks.TaintEffect.NO_SCHEDULE
            }
        ]);
    }

    return result;
}
