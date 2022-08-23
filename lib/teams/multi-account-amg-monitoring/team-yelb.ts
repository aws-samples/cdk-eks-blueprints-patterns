import { ApplicationTeam } from '@aws-quickstart/eks-blueprints';
import { ArnPrincipal } from 'aws-cdk-lib/aws-iam';

export class YelbTeam extends ApplicationTeam {
    constructor(accountID: string, environment: string) {
        super({
            name: `yelb-${environment}`,
            users: [
                new ArnPrincipal(`arn:aws:iam::${accountID}:user/yelb-user`),
            ],
            namespace: 'yelb',
        });
    }
}