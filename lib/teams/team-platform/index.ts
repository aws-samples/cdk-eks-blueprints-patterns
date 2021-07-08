import { ArnPrincipal } from "@aws-cdk/aws-iam";

import { PlatformTeam } from '@shapirov/cdk-eks-blueprint';

export class TeamPlatform extends PlatformTeam {
    constructor(accountID: string) {
        super({
            name: "platform",
            users: [new ArnPrincipal(`arn:aws:iam::${accountID}:user/superadmin`)]
        })
    }
}