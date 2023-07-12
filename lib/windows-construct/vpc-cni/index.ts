import * as blueprints from '@aws-quickstart/eks-blueprints';
import { Construct } from 'constructs';

export class WindowsVpcCni implements blueprints.ClusterAddOn {
    id: "amazon-vpc-cni";

    deploy(clusterInfo: blueprints.ClusterInfo): void | Promise<Construct> {
        const cluster = clusterInfo.cluster;
        const configmap = cluster.addManifest("amazon-vpc-cni", {
            apiVersion: "v1",
            kind: "ConfigMap",
            metadata: {
                name: "amazon-vpc-cni",
                namespace: "kube-system",
            },
            data:{
                "enable-windows-ipam": "true"
            },
        });

        return Promise.resolve(configmap);
    }
}

