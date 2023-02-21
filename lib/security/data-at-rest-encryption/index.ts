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
  build(scope: Construct, id: string) {
    const stackId = `${id}-blueprint`;

    // replace with your KMS keys
    const kmsKeys = [
      "arn:aws:kms:us-west-2:111122223333:key/1234abcd-12ab-34cd-56ef-1234567890ab",
      "arn:aws:kms:us-west-2:111122223333:key/0987dcba-09fe-87dc-65ba-ab0987654321",
    ];

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
