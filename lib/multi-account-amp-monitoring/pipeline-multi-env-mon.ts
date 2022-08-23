import * as blueprints from '@aws-quickstart/eks-blueprints';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import AmpMonitoringConstruct from '../amp-monitoring';
import { AmpIamSetupStack } from './amp-iam-setup'
import { CloudWatchIamSetupStack } from './cloudwatch-iam-setup'
import { AmgIamSetupStack, AmgIamSetupStackProps } from './amg-iam-setup'
import CloudWatchMonitoringConstruct from '../cloudwatch-monitoring';

// Team implementations
import * as team from '../teams/multi-account-amg-monitoring';

const logger = blueprints.utils.logger;

/**
 * Function relies on a secret called "cdk-context" defined in the target region (pipeline account must have it)
 * @returns 
 */
export async function populateAccountWithContextDefaults(): Promise<PipelineMultiEnvMonitoringProps> {
    // Populate Context Defaults for all the accounts
    const cdkContext = JSON.parse(await blueprints.utils.getSecretValue('cdk-context', 'us-east-1'))['context'] as PipelineMultiEnvMonitoringProps;
    logger.debug(`Retrieved CDK context ${JSON.stringify(cdkContext)}`);
    return cdkContext;
}

export interface PipelineMultiEnvMonitoringProps {
    /**
     * The CDK environment where dev&test, prod, and piplines will be deployed to 
     */
    prodEnv1: cdk.Environment;
    prodEnv2: cdk.Environment;
    pipelineEnv: cdk.Environment;
    monitoringEnv: cdk.Environment;
}

export default class PipelineMultiEnvMonitoring {

    async buildAsync(scope: Construct) {
        const context = await populateAccountWithContextDefaults();
        // environments IDs consts
        const PROD1_ENV_ID = `prod1-${context.prodEnv1.region}`
        const PROD2_ENV_ID = `prod2-${context.prodEnv2.region}`
        const MON_ENV_ID = `central-monitoring-${context.monitoringEnv.region}`

        // build teams per environments
        const prod1Teams = createTeamList('prod1', scope, context.prodEnv1.account!);
        const prod2Teams = createTeamList('prod2', scope, context.prodEnv2.account!);

        const blueprintAmp = new AmpMonitoringConstruct().create(scope, context.prodEnv1.account, context.prodEnv1.region);
        const blueprintCloudWatch = new CloudWatchMonitoringConstruct().create(scope, context.prodEnv2.account, context.prodEnv2.region);

        // Argo configuration per environment
        const devArgoAddonConfig = createArgoAddonConfig('dev', 'https://github.com/aws-samples/eks-blueprints-workloads.git');
        const testArgoAddonConfig = createArgoAddonConfig('test', 'https://github.com/aws-samples/eks-blueprints-workloads.git');
        const prodArgoAddonConfig = createArgoAddonConfig('prod', 'https://github.com/aws-samples/eks-blueprints-workloads.git');

        // const { gitOwner, gitRepositoryName } = await getRepositoryData();
        const gitOwner = 'aws-samples';
        const gitRepositoryName = 'cdk-eks-blueprints-patterns';

        const amgIamSetupStackProps : AmgIamSetupStackProps  = {
            roleName: "amgWorkspaceIamRole",  
            accounts: [context.prodEnv1.account!, context.prodEnv2.account!],
            env: {
                account: context.monitoringEnv.account!,
                region: context.monitoringEnv.region!
            }
        };

        blueprints.CodePipelineStack.builder()
            .name("multi-account-central-pipeline")
            .owner(gitOwner)
            .repository({
                repoUrl: gitRepositoryName,
                credentialsSecretName: 'github-token-secret',
                targetRevision: 'feature/PatternEKSMultiMon',
            })
            .enableCrossAccountKeys()
            .wave({
                id: "prod-test",
                stages: [
                    {
                        id: PROD1_ENV_ID,
                        stackBuilder: blueprintAmp
                            .clone(context.prodEnv1.region, context.prodEnv1.account)
                            .teams(...prod1Teams)
                            .addOns(new blueprints.NestedStackAddOn({
                                builder: AmpIamSetupStack.builder("ampPrometheusDataSourceRole", context.monitoringEnv.account!),
                                id: "amp-iam-nested-stack"
                            }))
                            .addOns(
                                prodArgoAddonConfig,
                            )
                            .name(PROD1_ENV_ID)
                    },
                    {
                        id: PROD2_ENV_ID,
                        stackBuilder: blueprintCloudWatch
                            .clone(context.prodEnv2.region, context.prodEnv2.account)
                            .teams(...prod2Teams)
                            .addOns(new blueprints.NestedStackAddOn({
                                builder: CloudWatchIamSetupStack.builder("cloudwatchPrometheusDataSourceRole", context.monitoringEnv.account!),
                                id: "cloudwatch-iam-nested-stack"
                            }))
                            .addOns(
                                prodArgoAddonConfig,
                            )
                            .name(PROD2_ENV_ID)
                    },
                    {
                        id: MON_ENV_ID,
                        stackBuilder: <blueprints.StackBuilder> {
                            build(scope: Construct, id: string, stackProps? : cdk.StackProps) : cdk.Stack { 
                                return new AmgIamSetupStack(scope, "amg-iam-setup", amgIamSetupStackProps);
                            }
                        }
                    },
                ],
            })
            .build(scope, "multi-account-central-pipeline", {
                env: context.pipelineEnv
            });
    }
}

function createTeamList(environments: string, scope: Construct, account: string): Array<blueprints.Team> {
    const teamsList = [
        new team.YelbTeam(account, environments),
        new team.Ho11yTeam(account, environments),
    ];
    return teamsList;

}
function createArgoAddonConfig(environment: string, repoUrl: string): blueprints.ArgoCDAddOn {
    interface argoProjectParams {
        githubOrg: string,
        githubRepository: string,
        projectNamespace: string
    }

    const argoConfig = new blueprints.ArgoCDAddOn(
        {
            bootstrapRepo: {
                repoUrl: repoUrl,
                path: `envs/${environment}`,
                targetRevision: 'feature/Yelb-app',
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

    return argoConfig
}