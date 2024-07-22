import {PlatformTeam} from "@aws-quickstart/eks-blueprints";
export class ProviderMgmtRoleTeam extends PlatformTeam {
    constructor(accountID :string) {
        const computedProviderRoleArn = `arn:aws:iam::${accountID}:role/eks-connector-role`;
        super( {
            name: computedProviderRoleArn,
            userRoleArn: computedProviderRoleArn
        });
    }
}