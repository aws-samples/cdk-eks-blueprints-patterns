import * as blueprints from '@aws-quickstart/eks-blueprints';
import { getSecretValue } from '@aws-quickstart/eks-blueprints/dist/utils/secrets-manager-utils';
import * as cdk from 'aws-cdk-lib';
import { StackProps } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as eks from 'aws-cdk-lib/aws-eks';
import { Construct } from 'constructs';
// Team implementations
import * as team from '../teams/pipeline-multi-env-gitops';

export function populateWithContextDefaults(app: cdk.App, defaultAccount: string, defaultRegion: string) {
    // Populate Context Defaults for the pipeline account
    let pipeline_account = app.node.tryGetContext('pipeline_account');
    pipeline_account ??= defaultAccount;
    let pipeline_region = app.node.tryGetContext('pipeline_region');
    pipeline_region ??= defaultRegion;
    const pipelineEnv: cdk.Environment = { account: pipeline_account, region: pipeline_region };

    // Populate Context Defaults for the Development account
    let dev_account = app.node.tryGetContext('dev_account');
    dev_account ??= defaultAccount;
    let dev_region = app.node.tryGetContext('dev_region');
    dev_region ??= defaultRegion;
    const devEnv: cdk.Environment = { account: dev_account, region: dev_region };

    // Populate Context Defaults for the Production  account
    let prod_account = app.node.tryGetContext('prod_account');
    prod_account ??= defaultAccount;
    let prod_region = app.node.tryGetContext('prod_region');
    prod_region ??= defaultRegion;
    const prodEnv: cdk.Environment = { account: prod_account, region: prod_region };
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
    readonly DEFAULT_ENV: cdk.Environment =
        {
            account: process.env.CDK_DEFAULT_ACCOUNT,
            region: process.env.CDK_DEFAULT_REGION,
        };

    async buildAsync(scope: Construct, id: string, pipelineProps: PipelineMultiEnvGitopsProps, props?: StackProps) {

        // environments IDs consts
        const DEV_ENV_ID = `dev-${pipelineProps.devEnv.region}`
        const TEST_ENV_ID = `test-${pipelineProps.devEnv.region}`
        const PROD_ENV_ID = `prod-${pipelineProps.prodEnv.region}`

        // build teams per environments
        const devTeams = createTeamList('dev', scope, pipelineProps.devEnv.account!);
        const testTeams = createTeamList('test', scope, pipelineProps.devEnv.account!);
        const prodTeams = createTeamList('prod', scope, pipelineProps.prodEnv.account!);

        try {
            // github-token is needed for CDK Pipeline functionality
            await getSecretValue('github-token', pipelineProps.pipelineEnv.region!); // Exclamation mark is used to avoid msg: ts(2345)
        }
        catch (error) {
            throw new Error(`github-token secret must be setup in AWS Secrets Manager for the GitHub pipeline.
                    The GitHub Personal Access Token should have these scopes:
                    * **repo** - to read the repository
                    * * **admin:repo_hook** - if you plan to use webhooks (true by default)
                    * @see https://docs.aws.amazon.com/codepipeline/latest/userguide/GitHub-create-personal-token-CLI.html`);
        }

        const clusterVersion = eks.KubernetesVersion.V1_21;

        /* eslint-disable */
        const blueMNG = new blueprints.MngClusterProvider({
            id: "primary-mng-blue",
            version: clusterVersion,
            minSize: 1,
            maxSize: 100,
            nodeGroupCapacityType: eks.CapacityType.SPOT,
            instanceTypes: [
                new ec2.InstanceType("m5.2xlarge"),
                new ec2.InstanceType("m5a.2xlarge"),
                new ec2.InstanceType("m5ad.2xlarge"),
                new ec2.InstanceType("m5d.2xlarge"),
            ],
        });
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

        // Argo configuration per environment
        const devArgoAddonConfig = createArgoAddonConfig('dev', 'git@github.com:aws-samples/eks-blueprints-workloads.git');
        const testArgoAddonConfig = createArgoAddonConfig('test', 'git@github.com:aws-samples/eks-blueprints-workloads.git');
        const prodArgoAddonConfig = createArgoAddonConfig('prod', 'git@github.com:aws-samples/eks-blueprints-workloads.git');

        try {

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
                    id: "dev-test",
                    stages: [
                        {
                            id: DEV_ENV_ID,
                            stackBuilder: blueprint
                                .clone(pipelineProps.devEnv.region, pipelineProps.devEnv.account)
                                .name(DEV_ENV_ID)
                                .teams(...devTeams)
                                .addOns(
                                    devArgoAddonConfig,
                                )
                        },
                        {
                            id: TEST_ENV_ID,
                            stackBuilder: blueprint
                                .clone(pipelineProps.devEnv.region, pipelineProps.devEnv.account)
                                .name(TEST_ENV_ID)
                                .teams(...testTeams)
                                .addOns(
                                    testArgoAddonConfig,
                                )
                        },

                    ],
                    props: {
                        post: [new blueprints.pipelines.cdkpipelines.ManualApprovalStep('manual-approval-before-production')]
                    }
                })
                .wave({
                    id: "prod",
                    stages: [
                        {
                            id: PROD_ENV_ID,
                            stackBuilder: blueprint
                                .clone(pipelineProps.prodEnv.region, pipelineProps.prodEnv.account)
                                .name(PROD_ENV_ID)
                                .teams(...prodTeams)
                                .addOns(
                                    prodArgoAddonConfig,
                                )
                        },
                    ]
                })
                .build(scope, "eks-blueprint-pipeline-stack", props);
        } catch (error) {
            console.log(error)
        }
    }
}



function createTeamList(environments: string, scope: Construct, account: string): Array<blueprints.Team> {
    const teamsList = [
        new team.CorePlatformTeam(account, environments),
        new team.FrontendTeam(account, environments),
        new team.BackendNodejsTeam(account, environments),
        new team.BackendCrystalTeam(account, environments),
    ];
    return teamsList;

}
function createArgoAddonConfig(environment: string, repoUrl: string): blueprints.ArgoCDAddOn {
    interface argoProjectParams {
        githubOrg: string,
        githubRepository: string,
        projectNamespace: string
    }
    let argoAdditionalProject: Array<Record<string, unknown>> = [];
    const projectNameList: argoProjectParams[] =
        [
            { githubOrg: 'aws-containers', githubRepository: 'ecsdemo-frontend', projectNamespace: 'ecsdemo-frontend' },
            { githubOrg: 'aws-containers', githubRepository: 'ecsdemo-nodejs', projectNamespace: 'ecsdemo-nodejs' },
            { githubOrg: 'aws-containers', githubRepository: 'ecsdemo-crystal', projectNamespace: 'ecsdemo-crystal' },
        ];

    projectNameList.forEach(element => {
        argoAdditionalProject.push(
            {
                name: element.githubRepository,
                namespace: "argocd",
                destinations: [{
                    namespace: element.projectNamespace,
                    server: "https://kubernetes.default.svc"
                }],
                sourceRepos: [
                    `git@github.com:${element.githubOrg}/${element.githubRepository}.git`,
                    `git@github.com:aws-samples/eks-blueprints-workloads.git`,
                ],
            }
        );
    });

    const argoConfig = new blueprints.ArgoCDAddOn(
        {
            bootstrapRepo: {
                repoUrl: repoUrl,
                path: `multi-repo/argo-app-of-apps/${environment}`,
                targetRevision: 'main',
                credentialsSecretName: 'github-ssh-key',
                credentialsType: 'SSH'
            },
            bootstrapValues: {
                service: {
                    type: 'LoadBalancer'
                },
                spec: {
                    ingress: {
                        host: 'dev.blueprint.com',
                    },
                },
            },
            values: {
                server: {
                    additionalProjects: argoAdditionalProject,
                }
            }
        }
    )

    return argoConfig
}