import * as eks from 'aws-cdk-lib/aws-eks';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

/**
 * Instance Mapping for fields such as chart, version, managed IAM policy.
 */
export interface InstanceMapping {
    amiType: eks.NodegroupAmiType,
    instanceType: ec2.InstanceType,
}
/**
 * List of all clusters deployed by conformitron
 */
export enum ClusterName {
  ARM = "arm",
  X86 = "x86",
  BR_X86 = "br-x86",
  BR_ARM = "br-arm",
  MONITORING = "grafana-monitoring"
}


export const clusterMappings : {[key in ClusterName]?: InstanceMapping } = {
    [ClusterName.ARM]: {
        amiType: eks.NodegroupAmiType.AL2023_ARM_64_STANDARD,
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.M7G, ec2.InstanceSize.XLARGE2)
    },
    [ClusterName.X86]: {
        amiType: eks.NodegroupAmiType.AL2023_X86_64_STANDARD,
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.M5, ec2.InstanceSize.XLARGE2)
    },
    [ClusterName.BR_ARM]: {
        amiType: eks.NodegroupAmiType.BOTTLEROCKET_ARM_64,
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.M7G, ec2.InstanceSize.XLARGE2)
    },
    [ClusterName.BR_X86]: {
        amiType: eks.NodegroupAmiType.BOTTLEROCKET_X86_64,
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.M5, ec2.InstanceSize.XLARGE2)
    },
    [ClusterName.MONITORING]: {
        amiType: eks.NodegroupAmiType.AL2023_X86_64_STANDARD,
        instanceType:  ec2.InstanceType.of(ec2.InstanceClass.M5, ec2.InstanceSize.LARGE)
    }
};
