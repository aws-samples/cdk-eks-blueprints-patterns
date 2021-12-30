import { ArnPrincipal, Effect, PolicyStatement } from '@aws-cdk/aws-iam';
import { Duration } from '@aws-cdk/core';

import { ClusterAddOn, ClusterInfo, PlatformTeam } from '@aws-quickstart/ssp-amazon-eks';

// export class NodeKarpenter extends PlatformTeam {
//   constructor(accountID: string) {
//     super({
//       name: 'karpenter',
//       users: [new ArnPrincipal(`arn:aws:iam::${accountID}:role/KarpenterNodeRole-bottlerocket-blueprint`)],
//     });
//   }
// }

export class NodeKarpenter extends PlatformTeam {
  constructor(accountID: string, stackID: string) {
    super({
      name: 'karpenter',
      users: [new ArnPrincipal(`arn:aws:iam::${accountID}:role/KarpenterNodeRole-${stackID}`)],
    });
  }

  //  protected defaultSetupAccess(clusterInfo: ClusterInfo) {
  //    const props = this.teamProps;
  //    const awsAuth = clusterInfo.cluster.awsAuth;

  //    const users = this.teamProps.users ?? [];
  //    const teamRole = this.getOrCreateRole(clusterInfo, users, props.userRoleArn);

  //    if (teamRole) {
  //      awsAuth.addRoleMapping(teamRole, { groups: [props.namespace! + '-team-group'], username: props.name });
  //      new CfnOutput(clusterInfo.cluster.stack, props.name + ' team role ', {
  //        value: teamRole ? teamRole.roleArn : 'none',
  //      });
  //    }
  //  }
}

/**
 * Configuration options for the add-on.
 */
export interface KarpenterProps {
  /**
   * Namespace where controller will be installed
   */
  namespace?: string;

  /**
   * Version of the controller, i.e. v2.2.0
   */
  //version?: string;

  /**
   * Helm chart version to use to install. Expected to match the controller version, e.g. v2.2.0 maps to 1.2.0
   */
  chartVersion?: string;
}

/**
 * Defaults options for the add-on
 */
const defaultProps: KarpenterProps = {
  namespace: 'kube-system',
  //version: 'v2.2.1',
  chartVersion: '0.4.3',
};

const KARPENTER = 'karpenter';
export class KarpenterAddOn implements ClusterAddOn {
  private options: KarpenterProps;

  constructor(props?: KarpenterProps) {
    this.options = { ...defaultProps, ...props };
  }

  deploy(clusterInfo: ClusterInfo) {
    const cluster = clusterInfo.cluster;
    const serviceAccount = cluster.addServiceAccount('karpenter-sa', {
      name: KARPENTER,
      namespace: this.options.namespace,
    });

    serviceAccount.addToPrincipalPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          //write operations
          'ec2:CreateLaunchTemplate',
          'ec2:CreateFleet',
          'ec2:RunInstances',
          'ec2:CreateTags',
          'iam:PassRole',
          'ec2:TerminateInstances',
          //'Read Operations',
          'ec2:DescribeLaunchTemplates',
          'ec2:DescribeInstances',
          'ec2:DescribeSecurityGroups',
          'ec2:DescribeSubnets',
          'ec2:DescribeInstanceTypes',
          'ec2:DescribeInstanceTypeOfferings',
          'ec2:DescribeAvailabilityZones',
          'ssm:GetParameter',
        ],
        resources: ['*'],
      }),
    );

    const karpenterChart = cluster.addHelmChart('Karpenter`', {
      chart: KARPENTER,
      repository: 'https://charts.karpenter.sh',
      namespace: this.options.namespace,
      release: KARPENTER,
      version: this.options.chartVersion,
      wait: true,
      timeout: Duration.minutes(15),
      values: {
        clusterName: cluster.clusterName,
        serviceAccount: {
          create: false,
          name: serviceAccount.serviceAccountName,
        },
        controller: {
          clusterName: cluster.clusterName,
          clusterEndpoint: cluster.clusterEndpoint,
        },
      },
    });

    karpenterChart.node.addDependency(serviceAccount);
    // return the Promise Construct for any teams that may depend on this
    return Promise.resolve(karpenterChart);
  }
}

//  aws iam create-service-linked-role --aws-service-name spot.amazonaws.com
