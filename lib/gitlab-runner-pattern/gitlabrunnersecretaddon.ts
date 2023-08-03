import 'source-map-support/register';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import * as eks from "aws-cdk-lib/aws-eks";
import { Construct } from 'constructs';
import { dependable } from '@aws-quickstart/eks-blueprints/dist/utils';
import { GitlabRunnerHelmAddon } from './gitlabrunnerhelmaddon';

export class GitlabRunnerSecretAddon implements blueprints.ClusterAddOn {
    id?: string | undefined;
    @dependable(blueprints.addons.ExternalsSecretsAddOn.name, GitlabRunnerHelmAddon.name)
    deploy(clusterInfo: blueprints.ClusterInfo): void | Promise<Construct> {
        const cluster = clusterInfo.cluster;
        const secretStore = new eks.KubernetesManifest(clusterInfo.cluster.stack, "ClusterSecretStore", {
            cluster: cluster,
            manifest: [
                {
                    apiVersion: "external-secrets.io/v1beta1",
                    kind: "ClusterSecretStore",
                    metadata: {
                        name: "ssm-parameter-store",
                        namespace: "default"
                    },
                    spec: {
                        provider: {
                            aws: {
                                service: "ParameterStore",
                                region: clusterInfo.cluster.stack.region,
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
        
        const externalSecret = new eks.KubernetesManifest(clusterInfo.cluster.stack, "ExternalSecret", {
            cluster: cluster,
            manifest: [
                {
                    apiVersion: "external-secrets.io/v1beta1",
                    kind: "ExternalSecret",
                    metadata: {
                        name: "external-gitlab-runner-credentials",
                        namespace: "gitlab"
                    },
                    spec: {
                        secretStoreRef: {
                            name: "ssm-parameter-store",
                            kind: "ClusterSecretStore",
                        },
                        target: {
                            name: "gitlab-runner-secret"
                        },
                        data: [
                            {
                                secretKey: "runner-registration-token",
                                remoteRef: {
                                    key: "/gitlab-runner/runner-registration-token"
                                },
                            },
                            {
                                secretKey: "runner-token",
                                remoteRef: {
                                    key: "/gitlab-runner/runner-token"
                                },
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