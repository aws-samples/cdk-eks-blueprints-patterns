import { ClusterAddOn, ClusterInfo, Values } from "@aws-quickstart/eks-blueprints/dist/spi";
import { KubectlProvider, ManifestDeployment } from "@aws-quickstart/eks-blueprints/dist/addons/helm-addon/kubectl-provider";
import { loadYaml, readYamlDocument } from "@aws-quickstart/eks-blueprints/dist/utils";
import { createNamespace } from "@aws-quickstart/eks-blueprints/dist/utils/namespace-utils";
import { getBedrockPolicyDocument } from "./iam-policy";
import * as iam from "aws-cdk-lib/aws-iam";

/**
 * Configuration options for the Bedrock add-on.
 */
export interface BedrockShowcaseAddonProps {
    
    /**
     * Name of the bedrock usecase.
     */
    name?: string;

    /**
     * Name of the service account namespace.
     */
    namespace?: string;

    /**
     * Create Namespace with the provided one.
     */
    createNamespace?: boolean

    /**
     * Name of the service account for Bedrock.
     */
    serviceAccountName?: string;

    /**
     * Application Image
     */
    imageName: string;

    /**
     * Application Image Tag
     */
    imageTag: string;
}
/**
 * Default props for the add-on.
 */
const defaultProps: BedrockShowcaseAddonProps = {
    name: 'showcase',
    namespace: 'bedrock',
    createNamespace: true,
    serviceAccountName: 'bedrock-service-account',
    imageTag: 'default',
    imageName: ""
};

/**
 * Implementation of Bedrock add-on for EKS Blueprints. Sets IRSA for 
 * bedrock with required IAM policy along with creating a namespace.
 */
export class BedrockShowcaseAddon implements ClusterAddOn {
    readonly props: BedrockShowcaseAddonProps;

    constructor(props?: BedrockShowcaseAddonProps) {
        this.props = { ...defaultProps, ...props };
    }

    deploy(clusterInfo: ClusterInfo): void {
        const cluster = clusterInfo.cluster;
        const namespace = this.props.namespace!;

        // Create the Bedrock service account.
        const serviceAccountName = this.props.serviceAccountName!;
        const sa = cluster.addServiceAccount(serviceAccountName, {
            name: serviceAccountName,
            namespace: namespace
        });

        // Create namespace
        if (this.props.createNamespace) {
            const ns = createNamespace(namespace, cluster, true);
            sa.node.addDependency(ns);
        }

        // Apply additional IAM policies to the service account.
        getBedrockPolicyDocument().forEach((statement) => {
            sa.addToPrincipalPolicy(iam.PolicyStatement.fromJson(statement));
        });

        const values: Values = {
            namespace: this.props.namespace,
            imageName: this.props.imageName,
            imageTag: this.props.imageTag
        };

        // Apply manifest
        const doc = readYamlDocument(__dirname + '/deployment/showcase-deployment.ytpl');
        const manifest = doc.split("---").map((e: any) => loadYaml(e));

        const manifestDeployment: ManifestDeployment = {
            name: this.props.name!,
            namespace: this.props.namespace!,
            manifest,
            values
        };
        const kubectlProvider = new KubectlProvider(clusterInfo);
        const bedrockDeployment = kubectlProvider.addManifest(manifestDeployment);
        bedrockDeployment.node.addDependency(sa);
    }
}