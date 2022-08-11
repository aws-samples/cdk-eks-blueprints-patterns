import * as blueprints from '@aws-quickstart/eks-blueprints';
import * as cdk from 'aws-cdk-lib';
import * as eks from 'aws-cdk-lib/aws-eks';
import { Construct } from 'constructs';
// Team implementations
import AmpMonitoringConstruct from '../amp-monitoring';
import { utils } from "@aws-quickstart/eks-blueprints";

export async function populateAccountWithContextDefaults(app: Construct, defaultAccount: string, defaultRegion: string) {
    // Populate Context Defaults for all the accounts

    const cdkContext = JSON.parse(await blueprints.utils.getSecretValue('cdk-context', 'us-east-1'));
    const prodEnv1: cdk.Environment = cdkContext['context']['prodEnv1'];
    const prodEnv2: cdk.Environment = cdkContext['context']['prodEnv2'];
    const pipelineEnv: cdk.Environment = cdkContext['context']['pipelineEnv'];
    const monitoringEnv: cdk.Environment = cdkContext['context']['monitoringEnv'];
    return { prodEnv1, prodEnv2, pipelineEnv, monitoringEnv };
}

export interface PipelineMultiEnvMonitoringProps {
    /**
     * The CDK environment where dev&test, prod, and piplines will be deployed to 
     */
    prodEnv1: cdk.Environment;
    prodEnv2: cdk.Environment;
    pipelineMonEnv: cdk.Environment;
    monitoringEnv: cdk.Environment;
}

export default class PipelineMultiEnvMonitoring {
    readonly DEFAULT_ENV: cdk.Environment =
        {
            account: process.env.CDK_DEFAULT_ACCOUNT,
            region: process.env.CDK_DEFAULT_REGION,
        };

    async buildAsync(scope: Construct, id: string) {
        const context = await populateAccountWithContextDefaults(scope, '940019131157', 'us-east-1');
        // environments IDs consts
        const PROD1_ENV_ID = `prod1-${context.prodEnv1.region}`
        const PROD2_ENV_ID = `prod2-${context.prodEnv2.region}`

        // build teams per environments

        const clusterVersion = eks.KubernetesVersion.V1_21;

        const blueprint = new AmpMonitoringConstruct().create(scope, context.prodEnv1.account, context.prodEnv1.region);

        try {

            // const { gitOwner, gitRepositoryName } = await getRepositoryData();
            const gitOwner = 'aws-samples';
            const gitRepositoryName = 'cdk-eks-blueprints-patterns';

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
                            stackBuilder: blueprint
                                .clone(context.prodEnv1.region, context.prodEnv1.account)
                                .name(PROD1_ENV_ID)
                                // .teams(...devTeams)
                                // .addOns(
                                //     devArgoAddonConfig,
                                // )
                        },
                        {
                            id: PROD2_ENV_ID,
                            stackBuilder: blueprint
                                .clone(context.prodEnv2.region, context.prodEnv2.account)
                                .name(PROD2_ENV_ID)
                                // .teams(...testTeams)
                                // .addOns(
                                //     testArgoAddonConfig,
                                // )
                        },

                    ],
                })
                .build(scope, "multi-account-central-pipeline",{
                    env: context.pipelineEnv
                });
        } catch (error) {
            console.log(error)
        }
    }
}



// function createTeamList(environments: string, scope: Construct, account: string): Array<blueprints.Team> {
//     const teamsList = [
//         new team.CorePlatformTeam(account, environments),
//         new team.FrontendTeam(account, environments),
//         new team.BackendNodejsTeam(account, environments),
//         new team.BackendCrystalTeam(account, environments),
//     ];
//     return teamsList;

// // }
// function createArgoAddonConfig(environment: string, repoUrl: string): blueprints.ArgoCDAddOn {
//     interface argoProjectParams {
//         githubOrg: string,
//         githubRepository: string,
//         projectNamespace: string
//     }
//     let argoAdditionalProject: Array<Record<string, unknown>> = [];
//     const projectNameList: argoProjectParams[] =
//         [
//             { githubOrg: 'aws-containers', githubRepository: 'ecsdemo-frontend', projectNamespace: 'ecsdemo-frontend' },
//             { githubOrg: 'aws-containers', githubRepository: 'ecsdemo-nodejs', projectNamespace: 'ecsdemo-nodejs' },
//             { githubOrg: 'aws-containers', githubRepository: 'ecsdemo-crystal', projectNamespace: 'ecsdemo-crystal' },
//         ];

//     projectNameList.forEach(element => {
//         argoAdditionalProject.push(
//             {
//                 name: element.githubRepository,
//                 namespace: "argocd",
//                 destinations: [{
//                     namespace: element.projectNamespace,
//                     server: "https://kubernetes.default.svc"
//                 }],
//                 sourceRepos: [
//                     `git@github.com:${element.githubOrg}/${element.githubRepository}.git`,
//                     `git@github.com:aws-samples/eks-blueprints-workloads.git`,
//                 ],
//             }
//         );
//     });

//     const argoConfig = new blueprints.ArgoCDAddOn(
//         {
//             bootstrapRepo: {
//                 repoUrl: repoUrl,
//                 path: `multi-repo/argo-app-of-apps/${environment}`,
//                 targetRevision: 'main',
//                 credentialsSecretName: 'github-ssh-key',
//                 credentialsType: 'SSH'
//             },
//             bootstrapValues: {
//                 service: {
//                     type: 'LoadBalancer'
//                 },
//                 spec: {
//                     ingress: {
//                         host: 'dev.blueprint.com',
//                     },
//                 },
//             },
//             values: {
//                 server: {
//                     additionalProjects: argoAdditionalProject,
//                 }
//             }
//         }
//     )

//     return argoConfig
// }