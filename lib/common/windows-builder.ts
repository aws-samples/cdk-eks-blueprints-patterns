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
    launchTemplateTags: {
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
                    mastersRole: blueprints.getResource(context => {
                        return new iam.Role(context.scope, 'AdminRole', { assumedBy: new iam.AccountRootPrincipal() });
                    }),
                    managedNodeGroups: [
                        addWindowsNodeGroup(options)
                    ]
                })
            )
            .addOns(
                new blueprints.NestedStackAddOn({
                    id: "usage-tracking-addon",
                    builder: UsageTrackingAddOn.builder(),
                }),
            );
        return builder;
    }
}

/**
 * Nested stack that is used as tracker for Windows Accelerator
 */
export class UsageTrackingAddOn extends NestedStack {

    static readonly USAGE_ID = "qp-1ub15bkuc";

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


function addWindowsNodeGroup(options: WindowsOptions): blueprints.ManagedNodeGroup {
    
    const windowsUserData = ec2.UserData.forWindows();
    windowsUserData.addCommands(`
      $ErrorActionPreference = 'Stop'
      $EKSBootstrapScriptPath = "C:\\\\Program Files\\\\Amazon\\\\EKS\\\\Start-EKSBootstrap.ps1"
      Try {
        & $EKSBootstrapScriptPath -EKSClusterName 'windows-eks-cluster'
      } Catch {
        Throw $_
      }
    `);
    const ebsDeviceProps: ec2.EbsDeviceProps = {
        deleteOnTermination: false,
        volumeType: ec2.EbsDeviceVolumeType.GP2
    };

    return {
        id: "mng-windows-ami",
        amiType: NodegroupAmiType.AL2_X86_64,
        instanceTypes: [new ec2.InstanceType(`${options.instanceClass}.${options.instanceSize}`)],
        desiredSize: options.desiredNodeSize,
        minSize: options.minNodeSize, 
        maxSize: options.maxNodeSize,
        nodeRole: blueprints.getNamedResource("node-role") as iam.Role,
        launchTemplate: {
            blockDevices: [
                {
                    deviceName: "/dev/sda1",
                    volume: ec2.BlockDeviceVolume.ebs(options.blockDeviceSize, ebsDeviceProps),
                }
            ],
            machineImage: ec2.MachineImage.genericWindows({
                'us-east-1': 'ami-0e80b8d281637c6c1',
                'us-east-2': 'ami-039ecff89038848a6',
                'us-west-1': 'ami-0c0815035bf1efb6e',
                'us-west-2': 'ami-029e1340b254a7667',
                'eu-west-1': 'ami-09af50f599f7f882c',
                'eu-west-2': 'ami-0bf1fec1eaef78230',
            }),
            securityGroup: blueprints.getNamedResource("my-cluster-security-group") as ec2.ISecurityGroup,
            tags: options.launchTemplateTags,
            userData: windowsUserData,
        }
    };
}