import { InstanceType } from '@aws-cdk/aws-ec2';
import * as cdk from '@aws-cdk/core';
import { CapacityType, KubernetesVersion } from '@aws-cdk/aws-eks';

// SSP Lib
import * as ssp from '@aws-quickstart/ssp-amazon-eks';

//TODO import * as iam from '@aws-cdk/aws-iam';
// import * as route53 from '@aws-cdk/aws-route53';

// Team implementations
import * as team from '../teams';
import { valueFromContext } from '@aws-quickstart/ssp-amazon-eks/dist/utils/context-utils';
import { EksBlueprint, GlobalResources, MngClusterProvider } from '@aws-quickstart/ssp-amazon-eks';
import MultiRegionConstruct from '../multi-region-construct';

const burnhamManifestDir = './lib/teams/team-burnham/';
const rikerManifestDir = './lib/teams/team-riker/';

const accountID = process.env.CDK_DEFAULT_ACCOUNT!;
const gitUrl = 'https://github.com/allamand/ssp-eks-workloads.git';

export default class KubeflowConstruct extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string) {
    super(scope, id);
    // Teams for the cluster.
    const teams: Array<ssp.Team> = [
      new team.TeamPlatform(accountID),
      new team.TeamTroiSetup(),
      new team.TeamRikerSetup(scope, rikerManifestDir),
      new team.TeamBurnhamSetup(scope, burnhamManifestDir),
    ];

    const subdomain: string = valueFromContext(scope, 'qua1.subzone.name', 'kubeflow2.eks.demo3.allamand.com');
    //const parentDnsAccountId = this.node.tryGetContext("parent.dns.account")!;
    const parentDomain = valueFromContext(this, 'parent.hostedzone.name', 'eks.demo3.allamand.com');

    EksBlueprint.builder()
      .account(process.env.CDK_DEFAULT_ACCOUNT)
      .region('eu-west-1')
      .teams(...teams)
      .resourceProvider(GlobalResources.HostedZone, new ssp.LookupHostedZoneProvider(parentDomain))
      .clusterProvider(
        //ATTENTION only the last clusterProvider is applied actually
        new MngClusterProvider({
          desiredSize: 1,
          maxSize: 10,
          minSize: 1,
          version: KubernetesVersion.V1_20,
          nodeGroupCapacityType: CapacityType.ON_DEMAND,
          instanceTypes: [new InstanceType('m5.xlarge')],
        }),
      )
      // .resourceProvider(GlobalResources.HostedZone, new ssp.DelegatingHostedZoneProvider({
      //     parentDomain,
      //     subdomain,
      //     parentDnsAccountId,
      //     delegatingRoleName: 'DomainOperatorRole',
      //     wildcardSubdomain: true
      // }))
      .resourceProvider(
        GlobalResources.Certificate,
        new ssp.CreateCertificateProvider('wildcard-cert', `*.${subdomain}`, GlobalResources.HostedZone),
      )
      .addOns(
        new ssp.CalicoAddOn(),
        new ssp.AwsLoadBalancerControllerAddOn(),
        new ssp.addons.ExternalDnsAddon({
          hostedZoneResources: [GlobalResources.HostedZone], // you can add more if you register resource providers
        }),
        new ssp.NginxAddOn({
          internetFacing: true,
          backendProtocol: 'tcp',
          externalDnsHostname: subdomain,
          crossZoneEnabled: false,
          certificateResourceName: GlobalResources.Certificate,
          values: {
            controller: {
              service: {
                httpsPort: {
                  targetPort: 'http',
                },
              },
            },
          },
        }),
        new ssp.ArgoCDAddOn({
          bootstrapRepo: {
            repoUrl: gitUrl,
            targetRevision: 'main',
            path: 'envs/qua1',
          },
          adminPasswordSecretName: MultiRegionConstruct.SECRET_ARGO_ADMIN_PWD,
          namespace: 'argocd',
          // values: {
          //     server: {
          //         serviceAccount: {
          //             create: false
          //         },
          //         config: {
          //             repositories: "",
          //             // [{
          //             //         gitUrl,
          //             //         usernameSecret: {
          //             //             name: secretName,
          //             //             key: "username"
          //             //         },
          //             //         passwordSecret: {
          //             //             name: secretName,
          //             //             key: "password"
          //             //         }
          //             //     }]
          //             secret: {
          //                 argocdServerAdminPassword: await ssp.ArgoCDAddOn.createAdminSecret(clusterInfo.cluster.stack.region);
          //             }
          //         },
          //         ingress: {
          //             enabled: true,
          //             hosts: [
          //              "argo."+subdomain,
          //             ]
          //         }
          //     }
          // }
        }),
        new ssp.MetricsServerAddOn(),
        new ssp.ClusterAutoScalerAddOn(),
        new ssp.ContainerInsightsAddOn(),
      )
      .build(scope, `${id}-blueprint`);
  }
}
