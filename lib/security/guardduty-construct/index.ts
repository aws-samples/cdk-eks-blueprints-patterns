import { Construct } from "constructs";
import * as blueprints from "@aws-quickstart/eks-blueprints";
import { SECRET_ARGO_ADMIN_PWD } from "../../multi-region-construct";
import { prevalidateSecrets } from "../../common/construct-utils";

const gitUrl = "https://github.com/aws-samples/eks-blueprints-workloads.git";
const targetRevision = "main";

export default class GuardDutyWorkloadConstruct {
    async buildAsync(scope: Construct, id: string) {
        await prevalidateSecrets(
            GuardDutyWorkloadConstruct.name, 
      process.env.CDK_DEFAULT_REGION!,
      SECRET_ARGO_ADMIN_PWD
        );

        const stackID = `${id}-blueprint`;

        await blueprints.EksBlueprint.builder()
            .account(process.env.CDK_DEFAULT_ACCOUNT!)
            .region(process.env.CDK_DEFAULT_REGION!)
            .addOns(
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
            .buildAsync(scope, stackID);
    }
}
