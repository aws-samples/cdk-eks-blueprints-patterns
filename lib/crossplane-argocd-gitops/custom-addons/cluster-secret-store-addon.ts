import { ClusterAddOn, ClusterInfo, ExternalsSecretsAddOn } from "@aws-quickstart/eks-blueprints";
import { dependable } from "@aws-quickstart/eks-blueprints/dist/utils";
import { Stack } from "aws-cdk-lib";
import { KubernetesManifest } from "aws-cdk-lib/aws-eks";
import { Construct } from "constructs";

export class ClusterSecretStoreAddOn implements ClusterAddOn {

    constructor(readonly clusterStoreName: string) {}

    @dependable(ExternalsSecretsAddOn.name)
    deploy(clusterInfo: ClusterInfo): void | Promise<Construct> {
        const clusterSecretStore = new KubernetesManifest(clusterInfo.cluster, "ClusterSecretStore", {
            cluster: clusterInfo.cluster,
            manifest: [
                {
                    apiVersion: "external-secrets.io/v1beta1",
                    kind: "ClusterSecretStore",
                    metadata: { name: this.clusterStoreName },
                    spec: {
                        provider: {
                            aws: {
                                service: "SecretsManager",
                                region: Stack.of(clusterInfo.cluster).region,
                                auth: {
                                    jwt: {
                                        serviceAccountRef: {
                                            name: "external-secrets-sa",
                                            namespace: "external-secrets",
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            ],
        });
        return Promise.resolve(clusterSecretStore);
    }
}