import { ApplicationTeam, BedrockBuilder, ClusterInfo } from "@aws-quickstart/eks-blueprints";
import * as blueprints from "@aws-quickstart/eks-blueprints";
import * as spi from '@aws-quickstart/eks-blueprints/dist/spi';
import { Construct } from "constructs";
import { loadYaml, readYamlDocument } from "@aws-quickstart/eks-blueprints/dist/utils";
import { KubectlProvider, ManifestDeployment } from "@aws-quickstart/eks-blueprints/dist/addons/helm-addon/kubectl-provider";

export default class GenAIShowcase {
    constructor(scope: Construct, id: string) {
        const account = process.env.CDK_DEFAULT_ACCOUNT!;
        const region = process.env.CDK_DEFAULT_REGION!;
        const stackID = `${id}-blueprint`;

        const bedrockTeamProps: blueprints.teams.BedrockTeamProps = {
            name: blueprints.utils.valueFromContext(scope, "bedrock.pattern.name", "showcase"),
            namespace: blueprints.utils.valueFromContext(scope, "bedrock.pattern.namespace", "bedrock"),
            createNamespace: true,
            serviceAccountName: 'bedrock-service-account',
            extensionFunction: extensionFunction
        }; 

        BedrockBuilder.builder()
            .account(account)
            .region(region)
            .version('auto')
            .addBedrockTeam(bedrockTeamProps)
            .build(scope, stackID);
    }
}

function extensionFunction(team: ApplicationTeam, clusterInfo: ClusterInfo) {
    const values: spi.Values = {
        namespace: team.teamProps.namespace,
        imageName: blueprints.utils.valueFromContext(clusterInfo.cluster, "bedrock.pattern.image.name", undefined),
        imageTag: blueprints.utils.valueFromContext(clusterInfo.cluster, "bedrock.pattern.image.tag", undefined),
        region: clusterInfo.cluster.stack.region
    };

    // Apply manifest
    const doc = readYamlDocument(__dirname + '/deployment/showcase-deployment.ytpl');
    const manifest = doc.split("---").map((e: any) => loadYaml(e));

    const manifestDeployment: ManifestDeployment = {
        name: team.teamProps.name,
        namespace: team.teamProps.namespace!,
        manifest,
        values
    };
    const manifestConstruct = new KubectlProvider(clusterInfo).addManifest(manifestDeployment);
    manifestConstruct.node.addDependency(team.serviceAccount);
}