import * as blueprints from "@aws-quickstart/eks-blueprints";
import {
  ArgoCDAddOn,
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
import { SECRET_ARGO_ADMIN_PWD } from "../../multi-region-construct";

// const gitUrl = "https://github.com/aws-samples/eks-blueprints-workloads.git";
const gitUrl =
  "https://github.com/aliaksei-ivanou/eks-blueprints-workloads.git";

export default class EksEncryptionConstruct {
  build(scope: Construct, id: string) {
    const stackId = `${id}-blueprint`;

    EksBlueprint.builder()
      .resourceProvider(GlobalResources.KmsKey, new blueprints.KmsKeyProvider())
      .addOns(
        new EbsCsiDriverAddOn({
          kmsKeys: [
            blueprints.getNamedResource(blueprints.GlobalResources.KmsKey),
          ],
        })
        // new ArgoCDAddOn({
        //   bootstrapRepo: {
        //     repoUrl: gitUrl,
        //     targetRevision: "main",
        //     path: "security/envs/dev",
        //   },
        //   bootstrapValues: {
        //     kmsKey: blueprints.getNamedResource(
        //       blueprints.GlobalResources.KmsKey
        //     ),
        //   },
        //   adminPasswordSecretName: SECRET_ARGO_ADMIN_PWD,
        // })
      )
      .teams() // add teams here
      .build(scope, stackId);
  }
}
