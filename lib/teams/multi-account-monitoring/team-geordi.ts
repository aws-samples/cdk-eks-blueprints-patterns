import { ApplicationTeam } from '@aws-quickstart/eks-blueprints';

export class TeamGeordi extends ApplicationTeam {
    constructor() {
        super({
            name: `team-geordi`,
            namespace: 'geordie',
        });
    }
}