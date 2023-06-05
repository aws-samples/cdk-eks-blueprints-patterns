import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as eks from "aws-cdk-lib/aws-eks";

import * as blueprints from "@aws-quickstart/eks-blueprints";

export default class GravitonConstruct {
  build(scope: Construct, id: string) {
    const stackID = `${id}-blueprint`;

    const mngProps = {
      version: eks.KubernetesVersion.V1_25,
      instanceTypes: [new ec2.InstanceType("t4g.large")],
      amiType: eks.NodegroupAmiType.AL2_ARM_64,
    };

    const clusterProvider = new blueprints.MngClusterProvider(mngProps);

    blueprints.EksBlueprint.builder()
      .account(process.env.CDK_DEFAULT_ACCOUNT!)
      .region(process.env.CDK_DEFAULT_REGION)
      .clusterProvider(clusterProvider)
      .addOns()
      .build(scope, stackID);
  }
}
