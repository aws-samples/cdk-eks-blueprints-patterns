import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as eks from "aws-cdk-lib/aws-eks";
import * as blueprints from "@aws-quickstart/eks-blueprints";
export default class GravitonConstruct {
  build(scope: Construct, id: string) {
    const account = process.env.CDK_DEFAULT_ACCOUNT!;
    const region = process.env.CDK_DEFAULT_REGION!;
    const stackID = `${id}-blueprint`;

    const mngProps: blueprints.MngClusterProviderProps = {
      version: eks.KubernetesVersion.V1_26,
      instanceTypes: [new ec2.InstanceType("m7g.large")],
      amiType: eks.NodegroupAmiType.AL2_ARM_64,
      desiredSize: 3,
      minSize: 2,
      maxSize: 6,
    };

    const addOns: Array<blueprints.ClusterAddOn> = [
      new blueprints.addons.AwsLoadBalancerControllerAddOn(),
      new blueprints.addons.ClusterAutoScalerAddOn(),
      new blueprints.addons.VpcCniAddOn(),
      new blueprints.addons.KubeStateMetricsAddOn(),
    ];
    const clusterProvider = new blueprints.MngClusterProvider(mngProps);

    blueprints.EksBlueprint.builder()
      .account(account)
      .region(region)
      .clusterProvider(clusterProvider)
      .addOns(...addOns)
      .build(scope, stackID);
  }
}
