import * as cdk from '@aws-cdk/core';

// SSP Lib
import * as ssp from '@aws-quickstart/ssp-amazon-eks';

export default class StarterConstruct extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string) {
    super(scope, id);

    // Onboard teams as necessary - import lib/teams
    const teams: Array<ssp.Team> = [];

    // Include more addons as necessary
    const addOns: Array<ssp.ClusterAddOn> = [new ssp.ArgoCDAddOn()];

    const stackID = `${id}-blueprint`;
    new ssp.EksBlueprint(
      scope,
      { id: stackID, addOns, teams },
      {
        env: {
          region: 'eu-west-1',
        },
      },
    );
  }
}
