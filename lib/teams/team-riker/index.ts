import { ApplicationTeam }  from '@aws-quickstart/eks-blueprints';
import { Construct } from 'constructs';
import { ArnPrincipal } from 'aws-cdk-lib/aws-iam';

function getUserArns(scope: Construct, key: string): ArnPrincipal[] {
    const context: string = scope.node.tryGetContext(key);
    if (context) {
        return context.split(",").map(e => new ArnPrincipal(e));
    }
    return [];
}

export class TeamRikerSetup extends ApplicationTeam {
    constructor(scope: Construct, teamManifestDir: string) {
        super({
            name: "riker",
            users: getUserArns(scope, "team-riker.users"),
            teamManifestDir: teamManifestDir,
            namespaceHardLimits: {
                'requests.cpu': '0.5', 
                'requests.memory': '1Gi',
                'limits.cpu': '1',
                'limits.memory': '2Gi'
            }
        });
    }
}