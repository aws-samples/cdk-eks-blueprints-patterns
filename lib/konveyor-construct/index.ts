import { StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as blueprints from "@aws-quickstart/eks-blueprints";
import {
    KonveyorAddOn,
    OlmAddOn,
} from "@claranet-ch/konveyor-eks-blueprint-addon";


export interface KonveyorConstructProps extends StackProps {
    /**
     * The AWS Account ID
     */
    account: string;
    /**
     * Region where AddOn will be deployed
     */
    region: string;
    /**
     * Parent domain name where the subdomain will be assigned
     */
    parentDomain: string;
    /**
     * Subdomain name to be assigned to the loadbalancer
     */
    konveyorLabel: string;
    /**
     * Hosted Zone ID
     */
    hostedZoneId: string;
    /**
     * Name of the SSL certificate to be attached to the load balancer
     */
    certificateResourceName: string;
}

export class KonveyorConstruct extends Construct {
    constructor(scope: Construct, id: string) {
        super(scope, id);

        // Definition of the add-on's properties
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

        blueprints.EksBlueprint.builder()
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
            .version('auto')
            .addOns(...addOns)
            .build(scope, props.konveyorLabel + "-cluster");
    }
}