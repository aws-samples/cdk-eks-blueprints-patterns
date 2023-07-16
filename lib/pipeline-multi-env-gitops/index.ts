import * as blueprints from '@aws-quickstart/eks-blueprints';
import { getSecretValue } from '@aws-quickstart/eks-blueprints/dist/utils/secrets-manager-utils';
import * as cdk from 'aws-cdk-lib';
import { StackProps } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as eks from 'aws-cdk-lib/aws-eks';
import { Construct } from 'constructs';
// Team implementations
import * as team from '../teams/pipeline-multi-env-gitops';
import { createNamespace } from '@aws-quickstart/eks-blueprints/dist/utils';

//pattern wide consts
const GITHUB_ORG = 'tsahiduek';
const CLUSTER_VERSION = eks.KubernetesVersion.V1_26;

export function populateWithContextDefaults(
    app: cdk.App,
    defaultAccount: string,
    defaultRegion: string
) {
    // Populate Context Defaults for the pipeline account
    // let pipeline_account = app.node.tryGetContext('pipeline_account');
    // pipeline_account = pipeline_account ?? defaultAccount;
    // let pipeline_region = app.node.tryGetContext('pipeline_region');
    // pipeline_region = pipeline_region ?? defaultRegion;
    // const pipelineEnv: cdk.Environment = {
    //     account: pipeline_account,
    //     region: pipeline_region,
    // };

    // build pipeline, dev-tes, and prod accounts
    const pipelineEnv = buildEnv(
        app,
        defaultAccount,
        defaultRegion,
        'pipeline'
    );
    const devEnv = buildEnv(app, defaultAccount, defaultRegion, 'dev');
    const prodEnv = buildEnv(app, defaultAccount, defaultRegion, 'prod');

    // // Populate Context Defaults for the Development account
    // let dev_account = app.node.tryGetContext('dev_account');
    // dev_account = dev_account ?? defaultAccount;
    // let dev_region = app.node.tryGetContext('dev_region');
    // dev_region = dev_region ?? defaultRegion;
    // const devEnv: cdk.Environment = {
    //     account: dev_account,
    //     region: dev_region,
    // };

    // // Populate Context Defaults for the Production  account
    // let prod_account = app.node.tryGetContext('prod_account');
    // prod_account = prod_account ?? defaultAccount;
    // let prod_region = app.node.tryGetContext('prod_region');
    // prod_region = prod_region ?? defaultRegion;
    // const prodEnv: cdk.Environment = {
    //     account: prod_account,
    //     region: prod_region,
    // };
    return { devEnv, pipelineEnv, prodEnv };
}

export interface PipelineMultiEnvGitopsProps {
    /**
     * The CDK environment where dev&test, prod, and piplines will be deployed to
     */
    devEnv: cdk.Environment;
    prodEnv: cdk.Environment;
    pipelineEnv: cdk.Environment;
}

export default class PipelineMultiEnvGitops {
    readonly DEFAULT_ENV: cdk.Environment = {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
    };

    async buildAsync(
        scope: Construct,
        id: string,
        pipelineProps: PipelineMultiEnvGitopsProps,
        props?: StackProps
    ) {
        // environments IDs consts
        const DEV_ENV_ID = `dev-${pipelineProps.devEnv.region}`;
        const TEST_ENV_ID = `test-${pipelineProps.devEnv.region}`;
        const PROD_ENV_ID = `prod-${pipelineProps.prodEnv.region}`;

        try {
            // github-token is needed for CDK Pipeline functionality
            await getSecretValue(
                'github-token',
                pipelineProps.pipelineEnv.region!
            ); // Exclamation mark is used to avoid msg: ts(2345)
        } catch (error) {
            throw new Error(`github-token secret must be setup in AWS Secrets Manager for the GitHub pipeline.
                    The GitHub Personal Access Token should have these scopes:
                    * **repo** - to read the repository
                    * * **admin:repo_hook** - if you plan to use webhooks (true by default)
                    * @see https://docs.aws.amazon.com/codepipeline/latest/userguide/GitHub-create-personal-token-CLI.html`);
        }

        // Fargate provider - only for Karpenter
        const genClusterProvider = new blueprints.GenericClusterProvider({
            version: CLUSTER_VERSION,
            fargateProfiles: {
                karpenter: {
                    fargateProfileName: 'karpenter',
                    selectors: [{ namespace: 'karpenter' }],
                },
            },
        });

        // commonly configured addons
        const addons: blueprints.ClusterAddOn[] = [
            new blueprints.AwsLoadBalancerControllerAddOn(),
            new blueprints.CertManagerAddOn(),
            new blueprints.SecretsStoreAddOn({
                values: {
                    linux: {
                        affinity: {
                            nodeAffinity: {
                                requiredDuringSchedulingIgnoredDuringExecution:
                                    {
                                        nodeSelectorTerms: [
                                            {
                                                matchExpressions: [
                                                    {
                                                        key: 'eks.amazonaws.com/compute-type',
                                                        operator: 'NotIn',
                                                        values: ['fargate'],
                                                    },
                                                ],
                                            },
                                        ],
                                    },
                            },
                        },
                    },
                },
            }),
            new blueprints.MetricsServerAddOn(),
        ];

        const blueprint = blueprints.EksBlueprint.builder()
            .version(CLUSTER_VERSION)
            .clusterProvider(genClusterProvider)
            .addOns(...addons);

        // custom addons per environment
        const devAddons = buildPerEnvAddons('dev', DEV_ENV_ID);
        const testAddons = buildPerEnvAddons('test', DEV_ENV_ID);
        const prodAddons = buildPerEnvAddons('prod', PROD_ENV_ID);

        try {
            // const { gitOwner, gitRepositoryName } = await getRepositoryData();
            const gitRepositoryName = 'cdk-eks-blueprints-patterns';

            blueprints.CodePipelineStack.builder()
                .application('npx ts-node bin/pipeline-multienv-gitops.ts')
                .name('eks-blueprint-pipeline')
                .owner(GITHUB_ORG)
                .codeBuildPolicies(blueprints.DEFAULT_BUILD_POLICIES)
                .repository({
                    repoUrl: gitRepositoryName,
                    credentialsSecretName: 'github-token',
                    targetRevision: 'update-gitops-pattern',
                    // targetRevision: 'main', // TODO change to main
                })
                .wave({
                    id: 'dev-test',
                    stages: [
                        {
                            id: DEV_ENV_ID,
                            stackBuilder: blueprint
                                .clone(
                                    pipelineProps.devEnv.region,
                                    pipelineProps.devEnv.account
                                )
                                .name(DEV_ENV_ID)
                                .teams(
                                    ...createTeamList(
                                        'dev',
                                        pipelineProps.devEnv.account!
                                    )
                                )
                                .addOns(...devAddons),
                        },
                        {
                            id: TEST_ENV_ID,
                            stackBuilder: blueprint
                                .clone(
                                    pipelineProps.devEnv.region,
                                    pipelineProps.devEnv.account
                                )
                                .name(TEST_ENV_ID)
                                .teams(
                                    ...createTeamList(
                                        'test',
                                        pipelineProps.devEnv.account!
                                    )
                                )
                                .addOns(...testAddons),
                        },
                    ],
                    props: {
                        post: [
                            new blueprints.pipelines.cdkpipelines.ManualApprovalStep(
                                'manual-approval-before-production'
                            ),
                        ],
                    },
                })
                .wave({
                    id: 'prod',
                    stages: [
                        {
                            id: PROD_ENV_ID,
                            stackBuilder: blueprint
                                .clone(
                                    pipelineProps.prodEnv.region,
                                    pipelineProps.prodEnv.account
                                )
                                .name(PROD_ENV_ID)
                                .teams(
                                    ...createTeamList(
                                        'prod',
                                        pipelineProps.prodEnv.account!
                                    )
                                )
                                .addOns(...prodAddons),
                        },
                    ],
                })
                .build(scope, 'eks-blueprint-pipeline-stack', props);
        } catch (error) {
            console.log(error);
        }
    }
}

function createTeamList(
    envId: string,
    account: string
): Array<blueprints.Team> {
    // Teams ids has to be globally unique --> injecting environment ID
    const teamsList = [
        new team.CorePlatformTeam(account, envId),
        new team.FrontendTeam(account, envId),
        new team.BackendNodejsTeam(account, envId),
        new team.BackendCrystalTeam(account, envId),
    ];
    return teamsList;
}
function createArgoAddonConfig(
    environment: string,
    repoUrl: string = `git@github.com:${GITHUB_ORG}/eks-blueprints-workloads.git`
): blueprints.ArgoCDAddOn {
    interface argoProjectParams {
        githubOrg: string;
        githubRepository: string;
        projectNamespace: string;
    }

    const argoConfig = new blueprints.ArgoCDAddOn({
        version: '5.37.0',
        bootstrapRepo: {
            repoUrl: repoUrl,
            path: `multi-repo/argo-app-of-apps/${environment}`,
            targetRevision: 'main',
            credentialsSecretName: 'github-ssh-key',
            credentialsType: 'SSH',
        },
        bootstrapValues: {
            service: {
                type: 'LoadBalancer',
            },
            spec: {
                ingress: {
                    host: 'dev.blueprint.com',
                },
            },
        },
        values: {
            server: {},
        },
    });

    return argoConfig;
}

function buildKarpenterConfig(environment: string): object {
    return {
        subnetTags: {
            'aws:cloudformation:stack-name': `${environment}-${environment}-blueprint`,
        },
        securityGroupTags: {
            'aws:eks:cluster-name': `${environment}-blueprint`,
        },
        interruptionHandling: true,
    };
}

function buildEnv(
    app: cdk.App,
    defaultAccount: string,
    defaultRegion: string,
    envName: string
): cdk.Environment {
    // Populate Context Defaults for the an account
    let account = app.node.tryGetContext(`${envName}_account`);
    account = account ?? defaultAccount;
    let region = app.node.tryGetContext(`${envName}_region`);
    region = region ?? defaultRegion;
    const env: cdk.Environment = {
        account: account,
        region: region,
    };

    return env;
}

function buildPerEnvAddons(
    envName: string,
    envId: string
): blueprints.ClusterAddOn[] {
    return [
        new blueprints.KarpenterAddOn(buildKarpenterConfig(envId)),
        createArgoAddonConfig(envName),
    ];
}