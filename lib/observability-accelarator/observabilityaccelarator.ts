import * as blueprints from '@aws-quickstart/eks-blueprints';
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import AmpMonitoringConstruct from '../amp-monitoring';
import { AmgSetupStack, AmgSetupStackProps } from './amg-setup';
import { AmpIamSetupStack } from './amp-iam-setup';

const logger = blueprints.utils.logger;

/**
 * Function relies on a secret called "cdk-context" defined in the target region
 * @returns 
 */
export async function populateAccountWithContextDefaults(): Promise<ObservabilityAccelaratorProps> {
    // Populate Context Defaults for all the accounts
    const cdkContext = JSON.parse(await blueprints.utils.getSecretValue('cdk-context', 'us-east-1'))['context'] as ObservabilityAccelaratorProps;
    logger.debug(`Retrieved CDK context ${JSON.stringify(cdkContext)}`);
    return cdkContext;
}

export interface ObservabilityAccelaratorProps {
    /**
     * Environment (account/region) where observability accelarator will be created
     */
    observabilityEnv: cdk.Environment;
}

/**
 * Observability Accelarator.
 */
export class ObservabilityAccelarator {

    async buildAsync(scope: Construct) {
        const context = await populateAccountWithContextDefaults();
        // environments IDs consts
        const ENV_ID = `eks-observability-${context.observabilityEnv.region}`

        const blueprintAmp = new AmpMonitoringConstruct().create(scope, context.observabilityEnv.account, context.observabilityEnv.region);

        // Argo configuration per environment
        const prodArgoAddonConfig = createArgoAddonConfig('prod', 'https://github.com/aws-samples/eks-blueprints-workloads.git');

        // const { gitOwner, gitRepositoryName } = await getRepositoryData();
        const gitOwner = 'aws-samples';
        const gitRepositoryName = 'cdk-eks-blueprints-patterns';

        const amgSetupStackProps: AmgSetupStackProps = {
            roleName: "amgWorkspaceIamRole",
            accounts: [context.observabilityEnv.account!],
            env: {
                account: context.observabilityEnv.account!,
                region: context.observabilityEnv.region!
            }
        };

        blueprints.CodePipelineStack.builder()
            .name("observability-accelarator")
            .owner(gitOwner)
            .codeBuildPolicies([ 
                new iam.PolicyStatement({
                    resources: ["*"],
                    actions: [    
                        "sts:AssumeRole",
                        "secretsmanager:GetSecretValue",
                        "secretsmanager:DescribeSecret",
                        "cloudformation:*"
                    ]
                })
            ])
            .repository({
                repoUrl: gitRepositoryName,
                credentialsSecretName: 'github-token',
                targetRevision: 'main',
            })
            .enableCrossAccountKeys()
            .wave({
                id: "prod-test",
                stages: [
                    {
                        id: ENV_ID,
                        stackBuilder: blueprintAmp
                            .clone(context.observabilityEnv.region, context.observabilityEnv.account)
                            .addOns(new blueprints.NestedStackAddOn({
                                builder: AmpIamSetupStack.builder("ampPrometheusDataSourceRole", context.observabilityEnv.account!),
                                id: "amp-iam-nested-stack"
                            }))
                            .addOns(
                                prodArgoAddonConfig,
                            )
                    },
                    {
                        id: ENV_ID,
                        stackBuilder: <blueprints.StackBuilder>{
                            build(scope: Construct): cdk.Stack {
                                return new AmgSetupStack(scope, "amg-setup", amgSetupStackProps);
                            }
                        }
                    },
                ],
            })
            .build(scope, "observability-accelarator", {
                env: context.observabilityEnv
            });
    }
}

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