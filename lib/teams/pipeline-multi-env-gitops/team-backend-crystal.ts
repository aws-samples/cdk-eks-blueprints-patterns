import { ApplicationTeam } from '@aws-quickstart/eks-blueprints';
import { ArnPrincipal } from 'aws-cdk-lib/aws-iam';

export class BackendCrystalTeam extends ApplicationTeam {
    constructor(accountID: string, environment: string) {
        super({
            name: `backend-crystal-${environment}`,
            users: [
                new ArnPrincipal(`arn:aws:iam::${accountID}:user/crystal-user`),
            ],
            namespace: 'ecsdemo-crystal',
        });
    }
}