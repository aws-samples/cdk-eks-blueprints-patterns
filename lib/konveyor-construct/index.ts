import { StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as blueprints from '@aws-quickstart/eks-blueprints';

export interface KonveyorConstructProps extends StackProps {
  account: string,
  region: string,
  parentDomain: string,
  konveyorLabel: string,
  hostedZoneId: string,
  certificateResourceName: string,
}

export class KonveyorConstruct extends Construct {
  constructor(scope: Construct, id: string, props: KonveyorConstructProps) {
    super(scope, id);

    const subdomain = props.konveyorLabel+"."+props.parentDomain;

    const addOns: Array<blueprints.ClusterAddOn> = [
      new blueprints.AwsLoadBalancerControllerAddOn(),
      new blueprints.VpcCniAddOn(),
      new blueprints.CoreDnsAddOn(),
      new blueprints.KubeProxyAddOn(),
      new blueprints.ExternalDnsAddOn({
        hostedZoneResources: [blueprints.GlobalResources.HostedZone]
      }),
      new blueprints.EbsCsiDriverAddOn(),
      new blueprints.OlmAddOn(),
      new blueprints.KonveyorAddOn({
        certificateResourceName: props.certificateResourceName,
        subdomain,
        featureAuthRequired: "true"
      })
    ];

    const blueprint = blueprints.EksBlueprint.builder()
    .account(props.account)
    .region(props.region)
    .resourceProvider(blueprints.GlobalResources.HostedZone, new blueprints.ImportHostedZoneProvider(props.hostedZoneId, props.parentDomain))
    .resourceProvider(props.certificateResourceName, new blueprints.CreateCertificateProvider("elb-certificate", subdomain, blueprints.GlobalResources.HostedZone))
    .addOns(...addOns)
    .build(scope, props.konveyorLabel+"-cluster");
  }
}
