import { ApplicationTeam } from '@aws-quickstart/eks-blueprints';
import { ArnPrincipal } from 'aws-cdk-lib/aws-iam';

export class Ho11yTeam extends ApplicationTeam {
    constructor(accountID: string, environment: string) {
        super({
            name: `ho11y-${environment}`,
            users: [
                new ArnPrincipal(`arn:aws:iam::${accountID}:user/ho11y-user`),
            ],
            namespace: 'geordie',
        });
    }
}