import * as blueprints from "@aws-quickstart/eks-blueprints";
import { loadYaml } from "@aws-quickstart/eks-blueprints/dist/utils";
import * as cdk from "aws-cdk-lib";
import { InstanaOperatorAddon } from "@instana/aws-eks-blueprint-addon";

export const instanaProps = {
  zone: {
    name: "eks-stack1", // Mandatory Parameter
  },
  cluster: {
    name: "eks-stack1", // Mandatory Parameter
  },
  agent: {
    key: "uBp4GXpZQpKrHxMXNcvInQ", // Mandatory Parameter
    endpointHost: "ingress-red-saas.instana.io", // Mandatory Parameter
    endpointPort: "443", // Mandatory Parameter
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