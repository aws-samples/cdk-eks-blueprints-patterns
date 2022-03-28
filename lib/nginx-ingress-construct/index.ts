import { Construct } from 'constructs';
import * as blueprints from '@aws-quickstart/eks-blueprints'
import { DelegatingHostedZoneProvider, GlobalResources } from '@aws-quickstart/eks-blueprints';
import { valueFromContext } from '@aws-quickstart/eks-blueprints/dist/utils/context-utils';
import * as team from '../teams'
import MultiRegionConstruct from '../multi-region-construct';


const burnhamManifestDir = './lib/teams/team-burnham/'
const rikerManifestDir = './lib/teams/team-riker/'
const teamManifestDirList = [burnhamManifestDir, rikerManifestDir]

const accountID = process.env.CDK_DEFAULT_ACCOUNT!;
const gitUrl = 'https://github.com/aws-samples/eks-blueprints-workloads.git';


/**
 * See docs/patterns/nginx.md for mode details on the setup.
 */
export default class NginxIngressConstruct {

    constructor(scope: Construct, id: string) {
        const teams: Array<blueprints.Team> = [
            new team.TeamPlatform(accountID),
            new team.TeamTroiSetup,
            new team.TeamRikerSetup(scope, teamManifestDirList[1]),
            new team.TeamBurnhamSetup(scope, teamManifestDirList[0])
        ];

        const subdomain: string = valueFromContext(scope, "dev.subzone.name", "dev.some.example.com");
        const parentDnsAccountId = scope.node.tryGetContext("parent.dns.account")!;
        const parentDomain = valueFromContext(scope, "parent.hostedzone.name", "some.example.com");

        blueprints.EksBlueprint.builder()
            .account(process.env.CDK_DEFAULT_ACCOUNT)
            .region('us-west-2')
            .teams(...teams)
            .resourceProvider(GlobalResources.HostedZone, new DelegatingHostedZoneProvider({
                parentDomain,
                subdomain,
                parentDnsAccountId,
                delegatingRoleName: 'DomainOperatorRole',
                wildcardSubdomain: true
            }))
            .resourceProvider(GlobalResources.Certificate, new blueprints.CreateCertificateProvider('wildcard-cert', `*.${subdomain}`, GlobalResources.HostedZone))
            .addOns(new blueprints.CalicoAddOn,
                new blueprints.AwsLoadBalancerControllerAddOn,
                new blueprints.ExternalDnsAddon({
                    hostedZoneResources: [blueprints.GlobalResources.HostedZone] // you can add more if you register resource providers
                }),
                new blueprints.NginxAddOn({
                    internetFacing: true,
                    backendProtocol: "tcp",
                    externalDnsHostname: subdomain,
                    crossZoneEnabled: false,
                    certificateResourceName: GlobalResources.Certificate
                }),
                new blueprints.SecretsStoreAddOn({ rotationPollInterval: "120s" }),
                new blueprints.ArgoCDAddOn({
                    bootstrapRepo: {
                        repoUrl: gitUrl,
                        targetRevision: "deployable",
                        path: 'envs/dev'
                    },
                    adminPasswordSecretName: MultiRegionConstruct.SECRET_ARGO_ADMIN_PWD,
                }),
                new blueprints.AppMeshAddOn,
                new blueprints.MetricsServerAddOn,
                new blueprints.ClusterAutoScalerAddOn,
                new blueprints.ContainerInsightsAddOn,
                new blueprints.XrayAddOn)
            .build(scope, `${id}-blueprint`);
    }
}

