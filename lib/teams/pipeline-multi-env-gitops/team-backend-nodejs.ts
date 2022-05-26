import { ApplicationTeam } from '@aws-quickstart/eks-blueprints';
import { ArnPrincipal } from 'aws-cdk-lib/aws-iam';

export class BackendNodejsTeam extends ApplicationTeam {
    constructor(accountID: string, environment: string) {
        super({
            name: `backend-nodejs-${environment}`,
            users: [
                new ArnPrincipal(`arn:aws:iam::${accountID}:user/nodejs-user`),
            ],
            namespace: 'ecsdemo-nodejs',

        });
    }
}