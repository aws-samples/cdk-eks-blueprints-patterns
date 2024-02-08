import * as blueprints from '@aws-quickstart/eks-blueprints';
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { EksAnywhereSecretsAddon } from './eksa-secret-stores';

const logger = blueprints.utils.logger;

/**
 * Function relies on a secret called "cdk-context" defined in the target region (pipeline account must have it)
 * @returns 
 */
export async function populateAccountWithContextDefaults(): Promise<PipelineMultiClusterProps> {
    // Populate Context Defaults for all the accounts
    const cdkContext = JSON.parse(await blueprints.utils.getSecretValue('cdk-context', 'us-east-1'))['context'] as PipelineMultiClusterProps;
    logger.debug(`Retrieved CDK context ${JSON.stringify(cdkContext)}`);
    return cdkContext;
}

export interface PipelineMultiClusterProps {
    /**
     * Production workload environment (account/region) #1 x86
     */
    prodEnv1: cdk.Environment;

    /**
     * Production workload environment (account/region) #2 AMD
     */
    prodEnv2: cdk.Environment;

    /**
     * Environment (account/region) where pipeline will be running (generally referred to as CICD account)
     */
    pipelineEnv: cdk.Environment;

}
/**
 * Main multi-account monitoring pipeline.
 */
export class PipelineMultiCluster {

    async buildAsync(scope: Construct) {
        const context = await populateAccountWithContextDefaults();

        // environments IDs consts
        const X86_ENV_ID = `eks-x86-${context.prodEnv1.region}`;
        const ARM_ENV_ID = `eks-arm-${context.prodEnv2.region}`;

        const CLUSTER_VERSIONS = [
            eks.KubernetesVersion.V1_24,
            eks.KubernetesVersion.V1_25,
            eks.KubernetesVersion.V1_26,
            eks.KubernetesVersion.V1_27,
        ]
        const x86ClusterProvider = new blueprints.MngClusterProvider({
            instanceTypes: [new ec2.InstanceType("m5.xlarge")],
            amiType: eks.NodegroupAmiType.AL2_X86_64,
            desiredSize: 2,
            maxSize: 3,
        })

        const armClusterProvider = new blueprints.MngClusterProvider({
            instanceTypes: [new ec2.InstanceType("m5.xlarge")],
            amiType: eks.NodegroupAmiType.AL2_ARM_64,
            desiredSize: 2,
            maxSize: 3,
        })

        const addons: Array<blueprints.ClusterAddOn> = [
            new blueprints.addons.ExternalsSecretsAddOn(),
            new blueprints.addons.FluxCDAddOn({
              repositories:[{
                   name: "eks-cloud-addons-conformance",
                   namespace: "flux-system",
                   repository: {
                       repoUrl: 'https://github.com/aws-samples/eks-anywhere-addons',
                       targetRevision: "main",
                   },
                   values: {
                       "region": "us-west-2"
                   },
                   kustomizations: [
                       {kustomizationPath: "./eks-anywhere-common/Addons/Core"},
                       {kustomizationPath: "./eks-anywhere-common/Addons/Partner"}, 
                       {kustomizationPath: "./eks-cloud/Addons/Core"}, 
                       {kustomizationPath: "./eks-cloud/Addons/Partner"}
                   ],
              }],
            }),
            new EksAnywhereSecretsAddon()
          ]; 
          
        const blueprintBuildersX86 = CLUSTER_VERSIONS.map((version) => blueprints.EksBlueprint.builder()
        .version(version)
        .clusterProvider(x86ClusterProvider)
        .addOns(...addons));

        const blueprintBuildersArm = CLUSTER_VERSIONS.map((version) => blueprints.EksBlueprint.builder()
        .version(version)
        .clusterProvider(armClusterProvider)
        .addOns(...addons));

        blueprints.CodePipelineStack.builder()
            .name("multi-cluster-pipeline")
            .owner("Howlla")
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
                repoUrl: "https://github.com/Howlla/eks-anywhere-addons",
                credentialsSecretName: 'github-token',
                targetRevision: 'main',
            })
            // .enableCrossAccountKeys()
            .wave({
                id: "prod-test",
                stages: [
                    {
                        id: X86_ENV_ID + `_1`,
                        stackBuilder:  blueprintBuildersX86[0]
                            .clone(context.prodEnv1.region, context.prodEnv1.account)
                    },
                    {
                        id: X86_ENV_ID + `_2`,
                        stackBuilder:  blueprintBuildersX86[1]
                            .clone(context.prodEnv1.region, context.prodEnv1.account)
                    },
                    {
                        id: X86_ENV_ID + `_3`,
                        stackBuilder:  blueprintBuildersX86[2]
                            .clone(context.prodEnv1.region, context.prodEnv1.account)
                    },
                    {
                        id: X86_ENV_ID + `_4`,
                        stackBuilder:  blueprintBuildersX86[3]
                            .clone(context.prodEnv1.region, context.prodEnv1.account)
                    },
                    {
                        id: ARM_ENV_ID + `_1`,
                        stackBuilder:  blueprintBuildersArm[0]
                            .clone(context.prodEnv2.region, context.prodEnv2.account)
                    },
                    {
                        id: ARM_ENV_ID + `_2`,
                        stackBuilder:  blueprintBuildersArm[1]
                            .clone(context.prodEnv2.region, context.prodEnv2.account)
                    },
                    {
                        id: ARM_ENV_ID + `_3`,
                        stackBuilder:  blueprintBuildersArm[2]
                            .clone(context.prodEnv2.region, context.prodEnv2.account)
                    },
                    {
                        id: ARM_ENV_ID + `_4`,
                        stackBuilder:  blueprintBuildersArm[3]
                            .clone(context.prodEnv2.region, context.prodEnv2.account)
                    },
                ],
            })
            .build(scope, "multi-cluster-central-pipeline", {
                env: context.pipelineEnv
            });
    }
}

