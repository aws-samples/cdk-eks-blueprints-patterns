import { Construct } from 'constructs';

// Blueprints Lib
import * as blueprints from '@aws-quickstart/eks-blueprints'


export default class StarterConstruct {
    constructor(scope: Construct, id: string) {
        // Onboard teams as necessary - import lib/teams
        const teams: Array<blueprints.Team> = [

        ];

        // Include more addons as necessary
        const addOns: Array<blueprints.ClusterAddOn> = [
            new blueprints.ArgoCDAddOn
        ];

        const stackID = `${id}-blueprint`
        new blueprints.EksBlueprint(scope, { id: stackID, addOns, teams }, {
            env: {
                region: 'us-east-2',
            },
        });
    }
}


