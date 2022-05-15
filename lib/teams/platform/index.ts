import { PlatformTeam } from '@aws-quickstart/eks-blueprints';
import { ArnPrincipal } from 'aws-cdk-lib/aws-iam';
import { Construct } from "constructs";

export class CorePlatformTeam extends PlatformTeam {
    constructor(scope: Construct, accountID: string, environment: string) {
        super({
            name: `platform-${environment}`,
            users: [
                new ArnPrincipal(`arn:aws:iam::${accountID}:user/platform`),
            ],
        })
    }
}