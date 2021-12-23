import * as cdk from '@aws-cdk/core';
import { KubernetesVersion } from '@aws-cdk/aws-eks';

// SSP Lib
import * as ssp from '@aws-quickstart/ssp-amazon-eks';
import { MngClusterProvider } from '@aws-quickstart/ssp-amazon-eks';

// Team implementations
import * as team from '../teams';
import { KarpenterAddOn } from '../teams/karpenter';

export default class ScratchpadConstruct extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string) {
    super(scope, id);


    const stackID = `${id}-blueprint`;

    const accountID = process.env.CDK_DEFAULT_ACCOUNT!;
    const platformTeam = new team.TeamPlatform(accountID);
    //const karpenterNodeRole = new team.NodeKarpenter(accountID);
    const karpenterNodeRole = new team.NodeKarpenter(accountID, stackID);
    const teams: Array<ssp.Team> = [platformTeam, karpenterNodeRole];

    // AddOns for the cluster.
    const addOns: Array<ssp.ClusterAddOn> = [
      new ssp.AwsLoadBalancerControllerAddOn(),
      //new ssp.NginxAddOn,
      new ssp.MetricsServerAddOn(),
      new ssp.ClusterAutoScalerAddOn(),
      new KarpenterAddOn(),
      new ssp.ContainerInsightsAddOn(),
    ];


    const clusterProvider = new MngClusterProvider({
      desiredSize: 3,
      maxSize: 10,
      version: KubernetesVersion.V1_20,
    });

    new ssp.EksBlueprint(
      scope,
      { id: stackID, addOns, clusterProvider },
      {
        env: {
          region: 'us-east-2',
        },
      },
    );
  }
}
