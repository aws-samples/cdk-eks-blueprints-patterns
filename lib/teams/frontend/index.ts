import { ApplicationTeam } from '@aws-quickstart/eks-blueprints';
import { ArnPrincipal } from 'aws-cdk-lib/aws-iam';
import { Construct } from "constructs";

export class FrontendTeam extends ApplicationTeam {
    constructor(scope: Construct, accountID: string, environment: string) {
        super({
            name: `frontend-${environment}`,
            users: [
                new ArnPrincipal(`arn:aws:iam::${accountID}:user/frontend-user`),
            ],
            // userRoleArn: 'arn:aws:iam::${accountID}:role/user-role',
            namespace: 'ecsdemo-frontend',
            // teamManifestDir: './lib/teams/frontend/'

            // namespaceHardLimits: {
            //     "requests.cpu": "1000m",
            //     "requests.memory": "4Gi",
            //     "limits.cpu": "2000m",
            //     "limits.memory": "8Gi",
            // },
        });
    }
}