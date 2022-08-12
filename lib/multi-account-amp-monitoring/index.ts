import * as blueprints from '@aws-quickstart/eks-blueprints';
import { NestedStack, NestedStackProps } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
// Team implementations
import AmpMonitoringConstruct from '../amp-monitoring';

/**
 * Function relies on a secret called "cdk-context" defined in the target region (pipeline account must have it)
 * @returns 
 */
export async function populateAccountWithContextDefaults(): Promise<PipelineMultiEnvMonitoringProps> {
    // Populate Context Defaults for all the accounts
    const cdkContext = JSON.parse(await blueprints.utils.getSecretValue('cdk-context', 'us-east-1'))['context'] as PipelineMultiEnvMonitoringProps;
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

export class AmpIamSetupStack extends NestedStack {

    public static builder(roleName: string, trustAccount: string): blueprints.NestedStackBuilder {
        return {
            build(scope: Construct, id: string, props: NestedStackProps) {
                return new AmpIamSetupStack(scope, id, props, roleName, trustAccount);
            }
        };
    }

    constructor(scope: Construct, id: string, props: NestedStackProps, roleName: string, trustAccount: string) {
        super(scope, id, props);

        const role = new iam.Role(this, 'amp-iam-trust-role', {
            roleName: roleName,
            assumedBy: new iam.AccountPrincipal(trustAccount),
            description: 'AMP role to assume from central account',
        });

        role.addToPolicy(new iam.PolicyStatement({
            actions: [
                "aps:ListWorkspaces",
                "aps:DescribeWorkspace",
                "aps:QueryMetrics",
                "aps:GetLabels",
                "aps:GetSeries",
                "aps:GetMetricMetadata"
            ],
            resources: ["*"],
        }));
    }
}

export default class PipelineMultiEnvMonitoring {

    async buildAsync(scope: Construct) {
        const context = await populateAccountWithContextDefaults();
        // environments IDs consts
        const PROD1_ENV_ID = `prod1-${context.prodEnv1.region}`
        const PROD2_ENV_ID = `prod2-${context.prodEnv2.region}`

        const blueprint = new AmpMonitoringConstruct().create(scope, context.prodEnv1.account, context.prodEnv1.region);

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
                            .addOns(new blueprints.NestedStackAddOn({
                                builder: AmpIamSetupStack.builder("Prod1AmpRole", context.monitoringEnv.account!),
                                id: "iam-nested-stack"
                            }))
                            .name(PROD1_ENV_ID)
                    },
                    {
                        id: PROD2_ENV_ID,
                        stackBuilder: blueprint
                            .clone(context.prodEnv2.region, context.prodEnv2.account)
                            .addOns(new blueprints.NestedStackAddOn({
                                builder: AmpIamSetupStack.builder("Prod2AmpRole", context.monitoringEnv.account!),
                                id: "iam-nested-stack"
                            }))
                            .name(PROD2_ENV_ID)
                    },
                ],
            })
            .build(scope, "multi-account-central-pipeline", {
                env: context.pipelineEnv
            });
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