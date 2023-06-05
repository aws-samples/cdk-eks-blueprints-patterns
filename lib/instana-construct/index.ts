import * as blueprints from "@aws-quickstart/eks-blueprints";
import { loadYaml } from "@aws-quickstart/eks-blueprints/dist/utils";
import * as cdk from "aws-cdk-lib";
import { InstanaOperatorAddon } from "@instana/aws-eks-blueprint-addon";

export const instanaProps = {
  zone: {
    name: "<INSTANA_ZONE_NAME>", // Mandatory Parameter
  },
  cluster: {
    name: "<AMAZON_EKS_CLUSTER_NAME>", // Mandatory Parameter
  },
  agent: {
    key: "<INSTANA_AGENT_KEY>", // Mandatory Parameter
    endpointHost: "<INSTANA_ENDPOINT_HOST_URL>", // Mandatory Parameter
    endpointPort: "<INSTANA_ENDPOINT_HOST_PORT>", // Mandatory Parameter
    env: {
      INSTANA_AGENT_TAGS: "staging",
    },
  },
};

const yamlObject = loadYaml(JSON.stringify(instanaProps));

export default class InstanaConstruct {
  async buildAsync(scope: cdk.App) {
    const stackID = instanaProps.cluster.name;

    const addOns: Array<blueprints.ClusterAddOn> = [
      new InstanaOperatorAddon(yamlObject),
    ];

    blueprints.EksBlueprint.builder()
      .account(process.env.CDK_DEFAULT_ACCOUNT!)
      .region(process.env.CDK_DEFAULT_REGION!)
      .addOns(...addOns)
      .name(stackID)
      .build(scope, stackID);
  }
}