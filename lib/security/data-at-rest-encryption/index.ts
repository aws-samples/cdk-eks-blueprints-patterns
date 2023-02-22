import * as blueprints from "@aws-quickstart/eks-blueprints";
import {
  AwsLoadBalancerControllerAddOn,
  CertManagerAddOn,
  ClusterAutoScalerAddOn,
  CoreDnsAddOn,
  EbsCsiDriverAddOn,
  EksBlueprint,
  GlobalResources,
  KubeProxyAddOn,
  MetricsServerAddOn,
  VpcCniAddOn,
} from "@aws-quickstart/eks-blueprints";
import { Construct } from "constructs";

export default class EksEncryptionConstruct {
  build(scope: Construct, id: string) {
    const stackId = `${id}-blueprint`;

    EksBlueprint.builder()
      .resourceProvider(GlobalResources.KmsKey, new blueprints.KmsKeyProvider())
      .addOns(
        new VpcCniAddOn(),
        new CoreDnsAddOn(),
        new MetricsServerAddOn(),
        new ClusterAutoScalerAddOn(),
        new CertManagerAddOn(),
        new AwsLoadBalancerControllerAddOn(),
        new EbsCsiDriverAddOn({
          kmsKeys: [
            blueprints.getNamedResource(blueprints.GlobalResources.KmsKey),
          ],
        }),
        new KubeProxyAddOn()
      )
      .teams() // add teams here
      .build(scope, stackId);
  }
}
