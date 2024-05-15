
import {PlatformTeam} from "@aws-quickstart/eks-blueprints";

export class ProviderMgmtRoleTeam extends PlatformTeam {
    constructor(accountID :string) {
        // compute the ARN explicitly since we know its name
        const computedProviderRoleArn = `arn:aws:iam::${accountID}:role/provider-aws-management-cluster`;
        super( {
            name: computedProviderRoleArn,
            userRoleArn: computedProviderRoleArn
        });
    }
}
