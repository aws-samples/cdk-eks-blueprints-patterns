import { InstanceType } from '@aws-cdk/aws-ec2';
import { CapacityType, FargateProfileOptions, KubernetesVersion } from '@aws-cdk/aws-eks';
import * as cdk from '@aws-cdk/core';
import { StackProps } from '@aws-cdk/core';

// SSP Lib
import * as ssp from '@aws-quickstart/ssp-amazon-eks';
import { GlobalResources, MngClusterProvider } from '@aws-quickstart/ssp-amazon-eks';
import { valueFromContext } from '@aws-quickstart/ssp-amazon-eks/dist/utils/context-utils';
//import * as wego from '@weaveworksoss/weavegitops-ssp-addon';

// import MultiRegionConstruct from '../multi-region-construct';

// Team implementations
import * as team from '../teams';

const accountID = process.env.CDK_DEFAULT_ACCOUNT!;
const gitUrl = 'https://github.com/allamand/ssp-eks-workloads.git';
const SECRET_ARGO_ADMIN_PWD = 'argo-admin-secret';

export default class PipelineConstruct extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props?: StackProps) {
    super(scope, id);
    const account = process.env.CDK_DEFAULT_ACCOUNT!;

    // Teams for the cluster.
    const teams: Array<ssp.Team> = [
      new team.TeamPlatform(accountID),
      new team.TeamTroiSetup(),
      new team.TeamRikerSetup(),
      new team.TeamBurnhamSetup(scope),
    ];

    const devSubdomain: string = valueFromContext(scope, 'dev.subzone.name', 'dev.eks.demo3.allamand.com');
    const testSubdomain: string = valueFromContext(scope, 'test.subzone.name', 'test.eks.demo3.allamand.com');
    const prodSubdomain: string = valueFromContext(scope, 'prod.subzone.name', 'prod.eks.demo3.allamand.com');

    const parentDomain = valueFromContext(this, 'parent.hostedzone.name', 'eks.demo3.allamand.com');

    // let bootstrapRepository = {
    //   URL: 'ssh://git@github.com/weaveworks/weave-gitops-ssp-addon',
    //   branch: 'main',
    //   path: './bootstrap',
    //   secretName: '<ARN for AWS Secrets Manager Secret holding SSH Credentials',
    // } as wego.BootstrapRepository;

    // const GitOps = new wego.WeaveGitOpsAddOn(bootstrapRepository, 'wego-system');

                // const fargateProfiles: Map<string, FargateProfileOptions> = new Map([
                //   ['fargate', { selectors: [{ namespace: 'fargate' }] }],
                // ]);

    const blueprint = ssp.EksBlueprint.builder()
      .account(account) // the supplied default will fail, but build and synth will pass
      .region('eu-west-1')
      .teams(...teams)
      .resourceProvider(GlobalResources.HostedZone, new ssp.LookupHostedZoneProvider(parentDomain))
      .clusterProvider(
        new MngClusterProvider({
          desiredSize: 1,
          maxSize: 3,
          minSize: 1,
          version: KubernetesVersion.V1_20,
          nodeGroupCapacityType: CapacityType.ON_DEMAND,
          instanceTypes: [
            new InstanceType('m5.xlarge'),
          ],
        }),
      )
      .clusterProvider(
        new MngClusterProvider({
          desiredSize: 3,
          maxSize: 20,
          minSize: 1,
          version: KubernetesVersion.V1_20,
          nodeGroupCapacityType: CapacityType.SPOT,
          instanceTypes: [
            //new InstanceType('m4.xlarge'),
            new InstanceType('m5.xlarge'),
            new InstanceType('m5a.xlarge'),
            new InstanceType('m5ad.xlarge'),
            new InstanceType('m5d.xlarge'),
            new InstanceType('t2.xlarge'),
            new InstanceType('t3.xlarge'),
            new InstanceType('t3a.xlarge'),
          ],
        }),
      )
      // .clusterProvider(
      //   new ssp.FargateClusterProvider({
      //     fargateProfiles,
      //     version: KubernetesVersion.V1_20,
      //   })
      // )
      .addOns(
        //new wego.WeaveGitOpsAddOn(bootstrapRepository, 'wego-system'),
        new ssp.AwsLoadBalancerControllerAddOn(),
        new ssp.addons.ExternalDnsAddon({
          hostedZoneResources: [GlobalResources.HostedZone], // you can add more if you register resource providers
        }),
        new ssp.CalicoAddOn(),
        new ssp.MetricsServerAddOn(),
        new ssp.ClusterAutoScalerAddOn(),
        new ssp.ContainerInsightsAddOn(),
      );

    ssp.CodePipelineStack.builder()
      .name('ssp-eks-pipeline')
      .owner('allamand')
      .repository({
        repoUrl: 'ssp-eks-patterns',
        credentialsSecretName: 'github-token',
        branch: 'pipeline',
      })
      .stage({
        id: 'ssp-dev',
        stackBuilder: blueprint
          .clone('eu-west-3')
          .resourceProvider(
            GlobalResources.Certificate,
            new ssp.CreateCertificateProvider('wildcard-cert', `*.${devSubdomain}`, GlobalResources.HostedZone),
          )
          .addOns(
            new ssp.ArgoCDAddOn({
              bootstrapRepo: {
                repoUrl: gitUrl,
                targetRevision: 'main',
                path: 'envs/dev',
              },
              adminPasswordSecretName: SECRET_ARGO_ADMIN_PWD,
              namespace: 'argocd',
            }),
            new ssp.NginxAddOn({
              internetFacing: true,
              backendProtocol: 'tcp',
              externalDnsHostname: devSubdomain,
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
          ),
      })

      .stage({
        id: 'ssp-test',
        stackBuilder: blueprint
          .clone('us-east-2')
          .resourceProvider(
            GlobalResources.Certificate,
            new ssp.CreateCertificateProvider('wildcard-cert', `*.${testSubdomain}`, GlobalResources.HostedZone),
          )
          .addOns(
            new ssp.ArgoCDAddOn({
              bootstrapRepo: {
                repoUrl: gitUrl,
                targetRevision: 'main',
                path: 'envs/test',
              },
              adminPasswordSecretName: SECRET_ARGO_ADMIN_PWD,
              namespace: 'argocd',
            }),
            new ssp.NginxAddOn({
              internetFacing: true,
              backendProtocol: 'tcp',
              externalDnsHostname: testSubdomain,
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
          ),
        stageProps: {
          manualApprovals: true,
        },
      })

      .stage({
        id: 'ssp-prod',
        stackBuilder: blueprint
          .clone('eu-west-1')
          .resourceProvider(
            GlobalResources.Certificate,
            new ssp.CreateCertificateProvider('wildcard-cert', `*.${prodSubdomain}`, GlobalResources.HostedZone),
          )
          .addOns(
            new ssp.ArgoCDAddOn({
              bootstrapRepo: {
                repoUrl: gitUrl,
                targetRevision: 'main',
                path: 'envs/prod',
              },
              adminPasswordSecretName: SECRET_ARGO_ADMIN_PWD,
              namespace: 'argocd',
            }),
            new ssp.NginxAddOn({
              internetFacing: true,
              backendProtocol: 'tcp',
              externalDnsHostname: prodSubdomain,
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
          ),
        stageProps: {
          manualApprovals: true,
        },
      })
      .build(scope, 'ssp-pipeline-stack', props);
  }
}
