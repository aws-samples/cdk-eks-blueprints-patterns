import * as blueprints from '@aws-quickstart/eks-blueprints';
import { KubernetesManifest } from 'aws-cdk-lib/aws-eks';
import { Construct } from 'constructs';

export class WindowsVpcCni implements blueprints.ClusterAddOn {
    id: "amazon-vpc-cni";

    deploy(clusterInfo: blueprints.ClusterInfo): void | Promise<Construct> {
        const cluster = clusterInfo.cluster;
        const configmap = new KubernetesManifest(cluster, 'amazon-vpc-cni', { cluster: cluster,
            manifest : [{
                apiVersion: "v1",
                kind: "ConfigMap",
                metadata: {
                    name: "amazon-vpc-cni",
                    namespace: "kube-system",
                },
                data:{
                    "enable-windows-ipam": "true"
                },
            }], overwrite: true });

        return Promise.resolve(configmap);
    }
}

