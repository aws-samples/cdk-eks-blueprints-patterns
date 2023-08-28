import { StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as blueprints from "@aws-quickstart/eks-blueprints";
import {
    KonveyorAddOn,
    OlmAddOn,
} from "@claranet-ch/konveyor-eks-blueprint-addon";

export interface KonveyorConstructProps extends StackProps {
    account: string;
    region: string;
    parentDomain: string;
    konveyorLabel: string;
    hostedZoneId: string;
    certificateResourceName: string;
}

export class KonveyorConstruct extends Construct {
    constructor(scope: Construct, id: string) {
        super(scope, id);

        const props = {
            account: process.env.CDK_DEFAULT_ACCOUNT,
            region: process.env.CDK_DEFAULT_REGION,
            namespace: blueprints.utils.valueFromContext(
                scope,
                "konveyor.namespace.name",
                "konveyor"
            ),
            parentDomain: blueprints.utils.valueFromContext(
                scope,
                "konveyor.parent.domain.name",
                "example.com"
            ),
            konveyorLabel: blueprints.utils.valueFromContext(
                scope,
                "konveyor.subdomain.label",
                "konveyor"
            ),
            hostedZoneId: blueprints.utils.valueFromContext(
                scope,
                "konveyor.hosted.zone.id",
                "1234567890"
            ),
            certificateResourceName: blueprints.utils.valueFromContext(
                scope,
                "konveyor.certificate.resource.name",
                "konveyor-certificate"
            ),
        };

        const subdomain = props.konveyorLabel + "." + props.parentDomain;

        const addOns: Array<blueprints.ClusterAddOn> = [
            new blueprints.AwsLoadBalancerControllerAddOn(),
            new blueprints.VpcCniAddOn(),
            new blueprints.CoreDnsAddOn(),
            new blueprints.KubeProxyAddOn(),
            new blueprints.ExternalDnsAddOn({
                hostedZoneResources: [blueprints.GlobalResources.HostedZone],
            }),
            new blueprints.EbsCsiDriverAddOn(),
            new OlmAddOn(),
            new KonveyorAddOn({
                certificateResourceName: props.certificateResourceName,
                subdomain,
                featureAuthRequired: "true",
            }),
        ];

        const blueprint = blueprints.EksBlueprint.builder()
            .account(props.account)
            .region(props.region)
            .resourceProvider(
                blueprints.GlobalResources.HostedZone,
                new blueprints.ImportHostedZoneProvider(
                    props.hostedZoneId,
                    props.parentDomain
                )
            )
            .resourceProvider(
                props.certificateResourceName,
                new blueprints.CreateCertificateProvider(
                    "elb-certificate",
                    subdomain,
                    blueprints.GlobalResources.HostedZone
                )
            )
            .addOns(...addOns)
            .build(scope, props.konveyorLabel + "-cluster");
    }
}