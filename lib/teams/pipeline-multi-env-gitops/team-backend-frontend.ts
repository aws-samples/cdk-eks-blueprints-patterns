import { ApplicationTeam } from '@aws-quickstart/eks-blueprints';
import { ArnPrincipal } from 'aws-cdk-lib/aws-iam';

export class FrontendTeam extends ApplicationTeam {
    constructor(accountID: string, environment: string) {
        super({
            name: `frontend-${environment}`,
            users: [
                new ArnPrincipal(`arn:aws:iam::${accountID}:user/frontend-user`),
            ],
            namespace: 'ecsdemo-frontend',
        });
    }
}