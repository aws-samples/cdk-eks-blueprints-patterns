import * as blueprints from "@aws-quickstart/eks-blueprints";
import {
  ArgoCDAddOn,
  EbsCsiDriverAddOn,
  EksBlueprint,
  GlobalResources,
} from "@aws-quickstart/eks-blueprints";
import * as kms from "aws-cdk-lib/aws-kms";
import { Construct } from "constructs";

// const gitUrl = "https://github.com/aws-samples/eks-blueprints-workloads.git";
// const targetRevision = "main";
const gitUrl =
  "https://github.com/aliaksei-ivanou/eks-blueprints-workloads.git";
const targetRevision = "ebs-encryption-at-rest";

export default class EksEncryptionConstruct {
  build(scope: Construct, id: string) {
    const stackId = `${id}-blueprint`;
    const kmsKey = blueprints.getNamedResource(
      blueprints.GlobalResources.KmsKey
    ) as kms.Key;

    EksBlueprint.builder()
      .resourceProvider(GlobalResources.KmsKey, new blueprints.KmsKeyProvider())
      .addOns(
        new EbsCsiDriverAddOn({
          kmsKeys: [kmsKey],
        }),
        new ArgoCDAddOn({
          bootstrapRepo: {
            repoUrl: gitUrl,
            targetRevision: targetRevision,
            path: "security/envs/dev",
          },
          bootstrapValues: {
            spec: {
              kmsKey: kmsKey.keyArn,
            },
          },
          // adminPasswordSecretName: SECRET_ARGO_ADMIN_PWD,
        })
      )
      .teams() // add teams here
      .build(scope, stackId);
  }
}
