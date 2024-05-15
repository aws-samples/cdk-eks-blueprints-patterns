import { ClusterInfo } from "@aws-quickstart/eks-blueprints";
import { CoreAddOn, CoreAddOnProps } from "@aws-quickstart/eks-blueprints/dist/addons/core-addon";
import { KubernetesManifest } from "aws-cdk-lib/aws-eks";
import { Construct } from "constructs";
import { ClusterSecretStoreAddOn } from "./cluster-secret-store-addon";
import { createNamespace } from "@aws-quickstart/eks-blueprints/dist/utils";

export type SecretMapping = {
    [k: string]: string[];
}

export interface SleekAddOnProps extends Omit<CoreAddOnProps, "saName"> {
    secretMappings?: SecretMapping[]; // secret name / secret key
    saName?: string;
}

export class SleekAddOn extends CoreAddOn {

    constructor(readonly props: SleekAddOnProps) {
        super({
            addOnName: props.addOnName,
            version: props.version,
            namespace: props.namespace,
            saName: props.saName ?? "" // currently required field in the core addon, hence set to something
        });
    }

    deploy(clusterInfo: ClusterInfo): Promise<Construct> {
        let secretStruct : Construct | undefined = undefined;
        const ns = createNamespace(this.props.namespace!, clusterInfo.cluster);
        const clusterStore: Promise<Construct> = clusterInfo.getScheduledAddOn(ClusterSecretStoreAddOn.name)!;
        this.props.secretMappings?.forEach( e => { 
            const secret = this.createSecret(e, clusterInfo);
            if (clusterStore) {
                clusterStore.then(e => secret.node.addDependency(e));
            }
            if(secretStruct != null) {
                secret.node.addDependency(secretStruct);
                secret.node.addDependency(ns);
            }
            secretStruct = secret;

        });
        const result = super.deploy(clusterInfo);
        if(secretStruct) {
            result.then(e => e.node.addDependency(secretStruct!));
        }
        return result;
    }

    private createSecret(secretMapping: SecretMapping, clusterInfo: ClusterInfo) {
        const secretName: string = Object.keys(secretMapping)[0];
        const keys: string[] = Object.values(secretMapping)[0];
        const awsSecretName = `${this.props.addOnName}-${secretName}`;
        const data: KeyData[] = [];
        keys.forEach(key => data.push({
            secretKey: key,
            remoteRef: {
                key: awsSecretName,
                property: key
            }
        }));
        const secret = new KubernetesManifest(clusterInfo.cluster, "secret-" + awsSecretName, {
            cluster: clusterInfo.cluster,
            manifest: [
                {
                    apiVersion: "external-secrets.io/v1beta1",
                    kind: "ExternalSecret",
                    metadata: {
                        name: secretName,
                        namespace: this.props.namespace
                    },
                    spec: {
                        secretStoreRef: {
                            name: "eksa-secret-store",
                            kind: "ClusterSecretStore",
                        },
                        target: {
                            name: secretName,
                            creationPolicy: "Merge",
                        },
                        data
                    },
                },
            ],
        });
        return secret;
    }
}

interface KeyData {
    secretKey: string;
    remoteRef: RemoteRefData;
}

interface RemoteRefData {
    key: string;
    property: string;
}