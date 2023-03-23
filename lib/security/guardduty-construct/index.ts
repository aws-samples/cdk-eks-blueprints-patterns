import { GuardDutySetupStack } from "./guard-duty-setup";
import { Construct } from "constructs";
import * as blueprints from "@aws-quickstart/eks-blueprints";
import { SECRET_ARGO_ADMIN_PWD } from "../../multi-region-construct";

const environmentName = "main";
const email = "your-email@example.com";

const gitUrl = "https://github.com/aws-samples/eks-blueprints-workloads.git";
const targetRevision = "main";

export default class GuardDutyNotifier {
  build(scope: Construct, id: string) {
    const stackID = `${id}-blueprint`;
    blueprints.EksBlueprint.builder()
      .account(process.env.CDK_ACCOUNT_ID!)
      .region(process.env.CDK_DEFAULT_REGION!)
      .addOns(
        new blueprints.NestedStackAddOn({
          builder: GuardDutySetupStack.builder(environmentName, email, {
            kubernetes: { auditLogs: { enable: true } },
            malwareProtection: {
              scanEc2InstanceWithFindings: { ebsVolumes: true },
            },
            s3Logs: { enable: true },
          }),
          id: "guardduty-nested-stack",
        }),
        new blueprints.ArgoCDAddOn({
          bootstrapRepo: {
            repoUrl: gitUrl,
            targetRevision: targetRevision,
            path: "teams/team-danger/dev",
          },
          adminPasswordSecretName: SECRET_ARGO_ADMIN_PWD,
        })
      )
      .teams()
      .build(scope, stackID);
  }
}
