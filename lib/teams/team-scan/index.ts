import { ApplicationTeam, ClusterInfo } from "@aws-quickstart/eks-blueprints";
import * as iam from "aws-cdk-lib/aws-iam";

export class TeamScan extends ApplicationTeam {
    constructor() {
        super({
            name: `team-scan`,
            namespace: "scan",
        });
    }

    protected setupServiceAccount(clusterInfo: ClusterInfo) {
        super.setupServiceAccount(clusterInfo);
        const ecrIamPolicy = new iam.PolicyStatement({
            actions: ["ecr:*"],
            resources: ["*"],
        });
        this.serviceAccount.addToPrincipalPolicy(ecrIamPolicy);
    }
}
