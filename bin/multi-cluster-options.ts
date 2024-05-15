import {CapacityType, KubernetesVersion} from "aws-cdk-lib/aws-eks";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as eks from "aws-cdk-lib/aws-eks";

export const K8S_VERSIONS_PROD :  KubernetesVersion[] = [KubernetesVersion.V1_25, KubernetesVersion.V1_26,
    KubernetesVersion.V1_27, KubernetesVersion.V1_28]; // KubernetesVersion.V1_29 // when the time comes
//export const K8S_VERSIONS_DEV :  KubernetesVersion[] = [ KubernetesVersion.V1_26 ,KubernetesVersion.V1_27, KubernetesVersion.V1_28, KubernetesVersion.of("1.29")];

export const K8S_VERSIONS_DEV :  KubernetesVersion[] = [ KubernetesVersion.of("1.29")];


export interface MultiClusterOptions {
    readonly account: string;
    readonly region: string;
    minSize?: number;
    maxSize?: number;
    desiredSize?: number;
    gitHubSecret?: string;
    nodeGroupCapacityType: CapacityType;
    instanceTypes?: ec2.InstanceType[];
    amiType?: eks.NodegroupAmiType;
    k8sVersions: KubernetesVersion[];
}
