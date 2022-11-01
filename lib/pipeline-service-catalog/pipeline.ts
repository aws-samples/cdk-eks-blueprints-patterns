import * as blueprints from '@aws-quickstart/eks-blueprints';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ServiceCatalogSetupStack } from './service-catalog-setup';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as team from '../teams/pipeline-multi-env-gitops';

const logger = blueprints.utils.logger;

/**
 * Function relies on a secret called "cdk-context" defined in the target region (pipeline account must have it)
 * @returns 
 */
export async function populateAccountWithContextDefaults(): Promise<PipelineServiceCatalogProps> {
    // Populate Context Defaults for all the accounts
    const cdkContext = JSON.parse(await blueprints.utils.getSecretValue('cdk-context', 'us-east-1'))['context'] as PipelineServiceCatalogProps;
    logger.debug(`Retrieved CDK context ${JSON.stringify(cdkContext)}`);
    return cdkContext;
}

export interface PipelineServiceCatalogProps {

    /**
     * Environment (account/region) where pipeline will be running (generally referred to as CICD account)
     */
    pipelineEnv: cdk.Environment;
}

/**
 * Service Catalog pipeline.
 */
export class PipelineServiceCatalog {

    async buildAsync(scope: Construct) {
        const context = await populateAccountWithContextDefaults();
        // environments IDs consts
        const ENV_ID = `eks-prod-${context.pipelineEnv.region}`
        const clusterVersion = eks.KubernetesVersion.V1_21;
        const prodTeams = createTeamList('prod', scope, context.pipelineEnv.account!);

        const greenMNG = new blueprints.MngClusterProvider({
            id: "primary-mng-green",
            version: clusterVersion,
            minSize: 1,
            maxSize: 100,
            nodeGroupCapacityType: eks.CapacityType.SPOT,
            instanceTypes: [
                new ec2.InstanceType("m5.xlarge"),
                new ec2.InstanceType("m5a.xlarge"),
                new ec2.InstanceType("m5ad.xlarge"),
                new ec2.InstanceType("m5d.xlarge"),
            ],
        });

        const blueprint = blueprints.EksBlueprint.builder()
            .version(clusterVersion)
            .clusterProvider(
                // blueMNG,
                greenMNG,
            )
            .addOns(
                // default addons for all environments
                new blueprints.CertManagerAddOn,
                new blueprints.AdotCollectorAddOn,
                new blueprints.SecretsStoreAddOn,
                new blueprints.AwsLoadBalancerControllerAddOn,
                new blueprints.NginxAddOn,
                new blueprints.AppMeshAddOn({
                    enableTracing: true
                }),
                new blueprints.CalicoOperatorAddOn,
                new blueprints.MetricsServerAddOn,
                new blueprints.ClusterAutoScalerAddOn(),
                new blueprints.CloudWatchAdotAddOn,
                new blueprints.XrayAddOn,
            );

        // const { gitOwner, gitRepositoryName } = await getRepositoryData();
        const gitOwner = 'aws-samples';
        const gitRepositoryName = 'cdk-eks-blueprints-patterns';

        blueprints.CodePipelineStack.builder()
        .name("eks-blueprint-pipeline")
        .owner(gitOwner)
        .repository({
            repoUrl: gitRepositoryName,
            credentialsSecretName: 'github-token',
            targetRevision: 'main',
            })
            .wave({
                id: "prod-test",
                stages: [
                    {
                        id: ENV_ID,
                        stackBuilder: blueprint
                            .clone(context.pipelineEnv.region, context.pipelineEnv.account)
                            .name(ENV_ID)
                            .teams(...prodTeams)
                            .addOns(new blueprints.NestedStackAddOn({
                                builder: ServiceCatalogSetupStack.builder("ServiceCatalogSetup", context.pipelineEnv.account!),
                                id: "service-catalog-setup-stack"
                            }))
                    },
                ],
            })
            .build(scope, "service-catalog-pipeline", {
                env: context.pipelineEnv
            });
    }
}

function createTeamList(environments: string, scope: Construct, account: string): Array<blueprints.Team> {
    const teamsList = [
        new team.CorePlatformTeam(account, environments),
        new team.FrontendTeam(account, environments),
    ];
    return teamsList;

}