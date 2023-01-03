import 'source-map-support/register';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import { DelegatingHostedZoneProvider, GlobalResources, utils } from '@aws-quickstart/eks-blueprints';
import { KubecostAddOn } from '@kubecost/kubecost-eks-blueprints-addon';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { prevalidateSecrets } from '../common/construct-utils';
import { SECRET_ARGO_ADMIN_PWD } from '../multi-region-construct';
import { CognitoIdpStack } from './cognito-setup';

import * as team from '../teams';

const burnhamManifestDir = './lib/teams/team-burnham/'
const rikerManifestDir = './lib/teams/team-riker/'
const teamManifestDirList = [burnhamManifestDir, rikerManifestDir]

const logger = blueprints.utils.logger;
const accountID = process.env.CDK_DEFAULT_ACCOUNT!;
const gitUrl = 'https://github.com/aws-samples/eks-blueprints-workloads.git';


/**
 * See docs/patterns/secure-ingress-cognito.md for mode details on the setup.
 */
export class PipelineSecureIngressCognito {

    async buildAsync(scope: Construct, id: string) {

        await prevalidateSecrets(PipelineSecureIngressCognito.name, undefined, SECRET_ARGO_ADMIN_PWD);

        const teams: Array<blueprints.Team> = [
            new team.TeamPlatform(accountID),
            new team.TeamTroiSetup,
            new team.TeamRikerSetup(scope, teamManifestDirList[1]),
            new team.TeamBurnhamSetup(scope, teamManifestDirList[0])
        ];

        const subdomain: string = utils.valueFromContext(scope, "dev.subzone.name", "dev.some.example.com");
        const parentDnsAccountId = scope.node.tryGetContext("parent.dns.account")!;
        const parentDomain = utils.valueFromContext(scope, "parent.hostedzone.name", "some.example.com");

        blueprints.HelmAddOn.validateHelmVersions = false;

        await blueprints.EksBlueprint.builder()
            .account(process.env.CDK_DEFAULT_ACCOUNT)
            .region(process.env.CDK_DEFAULT_REGION)
            .teams(...teams)
            .resourceProvider(GlobalResources.HostedZone, new DelegatingHostedZoneProvider({
                parentDomain,
                subdomain,
                parentDnsAccountId,
                delegatingRoleName: 'DomainOperatorRole',
                wildcardSubdomain: true
            }))
            .resourceProvider(GlobalResources.Certificate, new blueprints.CreateCertificateProvider('wildcard-cert', `*.${subdomain}`, GlobalResources.HostedZone))
            .addOns(
                new blueprints.VpcCniAddOn(),
                new blueprints.CoreDnsAddOn(),
                new blueprints.CertManagerAddOn,
                new blueprints.AwsLoadBalancerControllerAddOn,
                new KubecostAddOn(),
                new blueprints.ExternalDnsAddOn({
                    hostedZoneResources: [blueprints.GlobalResources.HostedZone] // you can add more if you register resource providers
                }),
                new blueprints.SecretsStoreAddOn({ rotationPollInterval: "120s" }),
                new blueprints.ArgoCDAddOn({
                    bootstrapRepo: {
                        repoUrl: gitUrl,
                        targetRevision: "deployable",
                        path: 'envs/dev'
                    },
                    adminPasswordSecretName: SECRET_ARGO_ADMIN_PWD,
                }),
                new blueprints.MetricsServerAddOn,
                new blueprints.ClusterAutoScalerAddOn)
            .buildAsync(scope, `${id}-blueprint`);

            blueprints.HelmAddOn.validateHelmVersions = false;
    }
}

/* 
function createArgoAddonConfig(environment: string, repoUrl: string): blueprints.ArgoCDAddOn {
    return new blueprints.ArgoCDAddOn(
        {
            bootstrapRepo: {
                repoUrl: repoUrl,
                path: `envs/${environment}`,
                targetRevision: 'main',
            },
            bootstrapValues: {
                spec: {
                    ingress: {
                        host: 'teamblueprints.com',
                    }
                },
            },
        }
    )
}
*/