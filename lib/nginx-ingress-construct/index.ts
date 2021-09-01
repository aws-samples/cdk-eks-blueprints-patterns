import * as cdk from '@aws-cdk/core';

// SSP Lib
import * as ssp from '@shapirov/cdk-eks-blueprint'

//TODO import * as iam from '@aws-cdk/aws-iam';
// import * as route53 from '@aws-cdk/aws-route53';


// Team implementations
import * as team from '../teams'
import { valueFromContext } from '@shapirov/cdk-eks-blueprint/dist/utils/context-utils';

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
        // AddOns for the cluster.
        const addOns: Array<ssp.ClusterAddOn> = [
            new ssp.AwsLoadBalancerControllerAddOn,
            new ssp.addons.ExternalDnsAddon({
                hostedZone: new ssp.addons.DelegatingHostedZoneProvider({
                    parentDomain,
                    subdomain, 
                    parentDnsAccountId,
                    delegatingRoleName: 'DomainOperatorRole', 
                    wildcardSubdomain: true
                })
            }),
            new ssp.NginxAddOn({ internetFacing: true, backendProtocol: "tcp", externalDnsHostname: subdomain, crossZoneEnabled: false  }),
            new ssp.ArgoCDAddOn,
            new ssp.CalicoAddOn,
            new ssp.MetricsServerAddOn,
            new ssp.ClusterAutoScalerAddOn,
            new ssp.ContainerInsightsAddOn,
        ];

        const stackID = `${id}-blueprint`;
        new EksBlueprint(scope, { id: stackID, addOns, teams }, {
            env: {
                account: process.env.CDK_DEFAULT_ACCOUNT,
                region: 'us-west-1',
            },
        });
    }
}

