import * as blueprints from '@aws-quickstart/eks-blueprints';
import * as eks from "aws-cdk-lib/aws-eks";
import { Construct } from 'constructs';
import { dependable } from "@aws-quickstart/eks-blueprints/dist/utils";
import { ISecret } from 'aws-cdk-lib/aws-secretsmanager';

export interface BackstageSecretAddOnProps {
    /**
    * Backstage Namespace
    */
    namespace: string,

    /**
     * The name of the Secret
     */
    databaseSecretTargetName: string,

    /**
     * The name of the Secret from the Resource Provider
     */
    databaseSecretResourceName: string
}

export class BackstageSecretAddOn implements blueprints.ClusterAddOn {
    readonly props: BackstageSecretAddOnProps;

    constructor(props: BackstageSecretAddOnProps) {
        this.props = props;
    }

    @dependable(blueprints.addons.ExternalsSecretsAddOn.name)
    deploy(clusterInfo: blueprints.ClusterInfo): void | Promise<Construct> {
        const cluster = clusterInfo.cluster;

        const secretStoreName = "secret-manager-store";
        const secretStore = new eks.KubernetesManifest(cluster.stack, "ClusterSecretStore", {
            cluster: cluster,
            manifest: [
                {
                    apiVersion: "external-secrets.io/v1beta1",
                    kind: "ClusterSecretStore",
                    metadata: {
                        name: secretStoreName,
                        namespace: this.props.namespace
                    },
                    spec: {
                        provider: {
                            aws: {
                                service: "SecretsManager",
                                region: cluster.stack.region,
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

        const databaseCredentialsSecret: ISecret | undefined = clusterInfo.getResource(this.props.databaseSecretResourceName);
        if (databaseCredentialsSecret === undefined) {
            throw new Error("Database Secret not found in context");
        }
        const databaseInstanceCredentialsSecretName = databaseCredentialsSecret.secretName;
        const externalSecret = new eks.KubernetesManifest(cluster.stack, "BackstageDatabaseExternalSecret", {
            cluster: cluster,
            manifest: [
                {
                    apiVersion: "external-secrets.io/v1beta1",
                    kind: "ExternalSecret",
                    metadata: {
                        name: "external-backstage-db-secret",
                        namespace: this.props.namespace
                    },
                    spec: {
                        secretStoreRef: {
                            name: secretStoreName,
                            kind: "ClusterSecretStore",
                        },
                        target: {
                            name: this.props.databaseSecretTargetName,
                        },
                        data: [
                            {
                                secretKey: "POSTGRES_PASSWORD",
                                remoteRef: {
                                    key: databaseInstanceCredentialsSecretName,
                                    property:  "password"
                                }
                            },
                            {
                                secretKey: "POSTGRES_USER",
                                remoteRef: {
                                    key: databaseInstanceCredentialsSecretName,
                                    property:  "username"
                                }
                            },
                        ],
                    },
                },
            ],
        });

        externalSecret.node.addDependency(secretStore);
        return Promise.resolve(secretStore);
    }
}
