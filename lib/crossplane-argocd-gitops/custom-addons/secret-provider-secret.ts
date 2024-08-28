

import { ApplicationTeam } from '@aws-quickstart/eks-blueprints';
// import { Construct } from 'constructs';
import 'source-map-support/register';

import * as blueprints from '@aws-quickstart/eks-blueprints';

export class TeamSpoc extends ApplicationTeam {
    // constructor(scope: Construct) {
    constructor() {        
        super({
            name: "argocd",
            // users: getUserArns(scope, "team-burnham.users"),
            teamSecrets: [
                {
                    secretProvider: new blueprints.LookupSecretsManagerSecretByName('github-token', 'github-token')
                }
            ]
        });
    }
}


// const blueprint = blueprints.EksBlueprint.builder()
//   .version("auto")
//   .addOns(addOn)
//   .teams(new TeamBurnham(app))
//   .build(app, 'my-stack-name');


