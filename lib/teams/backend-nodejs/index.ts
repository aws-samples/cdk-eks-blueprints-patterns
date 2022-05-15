import { ApplicationTeam } from '@aws-quickstart/eks-blueprints';
import { ArnPrincipal } from 'aws-cdk-lib/aws-iam';
import { Construct } from "constructs";

export class BackendNodejsTeam extends ApplicationTeam {
    constructor(scope: Construct, accountID: string, environment: string) {
        super({
            name: `backend-nodejs-${environment}`,
            users: [
                new ArnPrincipal(`arn:aws:iam::${accountID}:user/nodejs-user`),
            ],
            namespace: 'ecsdemo-nodejs',
            // teamManifestDir: './lib/teams/backend-nodejs/'

        });
    }
}