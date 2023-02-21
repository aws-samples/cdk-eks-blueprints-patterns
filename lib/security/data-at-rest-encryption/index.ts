import {
  AwsLoadBalancerControllerAddOn,
  CertManagerAddOn,
  ClusterAutoScalerAddOn,
  CoreDnsAddOn,
  EbsCsiDriverAddOn,
  EksBlueprint,
  KubeProxyAddOn,
  MetricsServerAddOn,
  VpcCniAddOn,
} from "@aws-quickstart/eks-blueprints";
import { Construct } from "constructs";

export default class EksEncryptionConstruct {
  build(scope: Construct, id: string, kmsKeys: string[]) {
    const stackId = `${id}-blueprint`;
    EksBlueprint.builder()
      .addOns(
        new VpcCniAddOn(),
        new CoreDnsAddOn(),
        new MetricsServerAddOn(),
        new ClusterAutoScalerAddOn(),
        new CertManagerAddOn(),
        new AwsLoadBalancerControllerAddOn(),
        new EbsCsiDriverAddOn({ kmsKeys: kmsKeys }),
        new KubeProxyAddOn()
      )
      .teams() // add teams here
      .build(scope, stackId);
  }
}
