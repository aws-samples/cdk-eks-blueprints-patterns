import { ApplicationTeam }  from '@aws-quickstart/ssp-amazon-eks';
import { Construct } from '@aws-cdk/core'
import { ArnPrincipal } from '@aws-cdk/aws-iam'

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
            teamManifestDir: teamManifestDir
        });
    }
}