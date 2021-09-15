import * as cdk from '@aws-cdk/core';

// SSP Lib
import * as ssp from '@aws-quickstart/ssp-amazon-eks'

//TODO import * as iam from '@aws-cdk/aws-iam';
// import * as route53 from '@aws-cdk/aws-route53';


// Team implementations
import * as team from '../teams'
import { valueFromContext } from '@aws-quickstart/ssp-amazon-eks/dist/utils/context-utils';
import { EksBlueprint, GlobalResources } from '@aws-quickstart/ssp-amazon-eks';

const accountID = process.env.CDK_DEFAULT_ACCOUNT!;


export default class NginxIngressConstruct extends cdk.Construct {

    constructor(scope: cdk.Construct, id: string) {
        super(scope, id);
        // Teams for the cluster.
        const teams: Array<ssp.Team> = [
            new team.TeamPlatform(accountID),
            new team.TeamTroiSetup,
            new team.TeamRikerSetup,
            new team.TeamBurnhamSetup(scope)
        ];

        const subdomain : string = valueFromContext(scope, "dev.subzone.name", "dev.some.example.com");
        const parentDnsAccountId = this.node.tryGetContext("parent.dns.account")!;
        const parentDomain = valueFromContext(this, "parent.hostedzone.name", "some.example.com");

        EksBlueprint.builder()
            .account(process.env.CDK_DEFAULT_ACCOUNT)
            .region('us-west-1')
            .teams(...teams)
            .resourceProvider(GlobalResources.HostedZone, new ssp.DelegatingHostedZoneProvider({
                parentDomain,
                subdomain, 
                parentDnsAccountId,
                delegatingRoleName: 'DomainOperatorRole', 
                wildcardSubdomain: true
            }))
            .resourceProvider(GlobalResources.Certificate, new ssp.CreateCertificateProvider('wildcard-cert', `*.${subdomain}`, GlobalResources.HostedZone))
            .addOns(new ssp.CalicoAddOn,
                new ssp.AwsLoadBalancerControllerAddOn,
                new ssp.addons.ExternalDnsAddon({
                    hostedZoneResources: [GlobalResources.HostedZone] // you can add more if you register resource providers
                }),
                new ssp.NginxAddOn({ 
                    internetFacing: true, 
                    backendProtocol: "tcp", 
                    externalDnsHostname: subdomain, 
                    crossZoneEnabled: false, 
                    certificateResourceName: GlobalResources.Certificate }),
                new ssp.ArgoCDAddOn,
                new ssp.MetricsServerAddOn,
                new ssp.ClusterAutoScalerAddOn,
                new ssp.ContainerInsightsAddOn )
            .build(scope, `${id}-blueprint`);
    }
}

