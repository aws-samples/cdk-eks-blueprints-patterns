
import { ApplicationTeam } from '@aws-quickstart/eks-blueprints';
import 'source-map-support/register';

import * as blueprints from '@aws-quickstart/eks-blueprints';

export class TeamSpoc extends ApplicationTeam {
    constructor() {        
        super({
            name: "argocd",
            teamSecrets: [
                {
                    secretProvider: new blueprints.LookupSecretsManagerSecretByName('github-token', 'github-token')
                }
            ]
        });
    }
}
