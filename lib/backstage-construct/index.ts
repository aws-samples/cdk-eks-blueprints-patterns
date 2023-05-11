import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import { BackstageSecretAddOn, BackstageSecretAddOnProps } from './backstage-secret-addon';
import { DatabaseInstanceCredentialsProvider, DatabaseInstanceCredentialsProviderProps } from './database-credentials'
import * as databaseInstanceProvider from './rds-database-instance';

export interface BackstageConstructProps extends cdk.StackProps {
  account: string,
  region: string,
  namespace: string,
  backstageImageRegistry: string,
  backstageImageRepository: string,
  backstageImageTag: string,
  parentDomain: string,
  backstageLabel: string,
  hostedZoneId: string,
  certificateResourceName: string,
  databaseResourceName: string,
  databaseInstancePort: number,
  databaseSecretResourceName: string,
  username: string,
  databaseSecretTargetName: string,
}

export class BackstageConstruct extends Construct {
  constructor(scope: Construct, id: string, props: BackstageConstructProps) {
    super(scope, id);

    const subdomain = props.backstageLabel+"."+props.parentDomain;
    
    const databaseInstanceCredentialsProviderProps = {
      username: props.username
    } as DatabaseInstanceCredentialsProviderProps;

    const databaseInstanceProps = {
      vpcResourceName: blueprints.GlobalResources.Vpc,
      databaseInstancePort: props.databaseInstancePort,
      databaseSecretResourceName: props.databaseSecretResourceName
    } as databaseInstanceProvider.DatabaseInstanceProviderProps;

    const backstageSecretAddOnProps = {
      namespace: props.namespace,
      databaseSecretResourceName: props.databaseSecretResourceName,
      databaseSecretTargetName: props.databaseSecretTargetName
    } as BackstageSecretAddOnProps;

    const backstageAddOnProps = {
      namespace: props.namespace,
      subdomain: subdomain,
      certificateResourceName: props.certificateResourceName,
      imageRegistry: props.backstageImageRegistry,
      imageRepository: props.backstageImageRepository,
      imageTag: props.backstageImageTag,
      databaseResourceName: props.databaseResourceName,
      databaseSecretTargetName: props.databaseSecretTargetName
    } as blueprints.BackstageAddOnProps;

    const addOns: Array<blueprints.ClusterAddOn> = [
      new blueprints.CalicoOperatorAddOn(),
      new blueprints.ClusterAutoScalerAddOn(),
      new blueprints.AwsLoadBalancerControllerAddOn(),
      new blueprints.VpcCniAddOn(),
      new blueprints.CoreDnsAddOn(),
      new blueprints.KubeProxyAddOn(),
      new blueprints.ExternalDnsAddOn({
        hostedZoneResources: [blueprints.GlobalResources.HostedZone]
      }),
      new blueprints.addons.ExternalsSecretsAddOn({}),
      new BackstageSecretAddOn(backstageSecretAddOnProps),
      new blueprints.BackstageAddOn(backstageAddOnProps)
    ];

    const blueprint = blueprints.EksBlueprint.builder()
    .account(props.account)
    .region(props.region)
    .resourceProvider(blueprints.GlobalResources.Vpc, new blueprints.VpcProvider())
    .resourceProvider(blueprints.GlobalResources.HostedZone, new blueprints.ImportHostedZoneProvider(props.hostedZoneId, props.parentDomain))
    .resourceProvider(props.certificateResourceName, new blueprints.CreateCertificateProvider("elb-certificate", subdomain, blueprints.GlobalResources.HostedZone))
    .resourceProvider(props.databaseSecretResourceName, new DatabaseInstanceCredentialsProvider(databaseInstanceCredentialsProviderProps))
    .resourceProvider(props.databaseResourceName, new databaseInstanceProvider.DatabaseInstanceProvider(databaseInstanceProps))
    .addOns(...addOns)
    .teams()
    .build(scope, props.backstageLabel+"-cluster");
  }
}
