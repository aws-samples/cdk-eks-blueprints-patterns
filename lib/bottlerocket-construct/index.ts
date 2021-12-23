import * as cdk from '@aws-cdk/core';

// SSP Lib
import * as ssp from '@aws-quickstart/ssp-amazon-eks';

// Team implementations
import * as team from '../teams';

import * as eks from '@aws-cdk/aws-eks';
import { AwsLoadBalancerControllerAddOn } from '@aws-quickstart/ssp-amazon-eks';
import { KarpenterAddOn } from '../teams/karpenter';

export default class BottlerocketConstruct extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string) {
    super(scope, id);

    const stackID = `${id}-blueprint`;

    // Setup platform team
    const accountID = process.env.CDK_DEFAULT_ACCOUNT!;
    const platformTeam = new team.TeamPlatform(accountID);
    //const karpenterNodeRole = new team.NodeKarpenter(accountID);
    const karpenterNodeRole = new team.NodeKarpenter(accountID, stackID);
    const teams: Array<ssp.Team> = [platformTeam, karpenterNodeRole];

    // AddOns for the cluster.
    const addOns: Array<ssp.ClusterAddOn> = [
      new AwsLoadBalancerControllerAddOn(),
      //new ssp.NginxAddOn,
      //new ssp.ArgoCDAddOn,
      //new ssp.CalicoAddOn,
      //new ssp.MetricsServerAddOn,
      //new KarpenterAddOn(),
      //new ssp.ClusterAutoScalerAddOn(), //cluster autoscaler not compatible with Bottlerocket
      new ssp.ContainerInsightsAddOn(),
    ];

    const clusterProvider = new ssp.AsgClusterProvider({
      version: eks.KubernetesVersion.V1_21,
      //machineImageType: eks.MachineImageType.BOTTLEROCKET,
      machineImageType: eks.MachineImageType.AMAZON_LINUX_2,
      minSize: 1,
      maxSize: 3,
      desiredSize: 3,
    });
    new ssp.EksBlueprint(
      scope,
      { id: stackID, teams, addOns, clusterProvider },
      {
        env: {
          region: 'eu-west-1',
        },
      },
    );
  }
}
