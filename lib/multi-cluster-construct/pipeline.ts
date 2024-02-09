import * as blueprints from '@aws-quickstart/eks-blueprints';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { EksAnywhereSecretsAddon } from './eksa-secret-stores';


/**
 * Main multi-cluster deployment pipeline.
 */
export class PipelineMultiCluster {

    async buildAsync(scope: Construct) {
        // const context = await populateAccountWithContextDefaults();
        const account = "810198167072";
        const region = "us-east-2";

        console.log(account,region)
        // environments IDs consts
        const X86_ENV_ID = `eks-x86-${region}`;
        const ARM_ENV_ID = `eks-arm-${region}`;

        const CLUSTER_VERSIONS = [
            eks.KubernetesVersion.V1_24,
            // eks.KubernetesVersion.V1_25,
            // eks.KubernetesVersion.V1_26,
            // eks.KubernetesVersion.V1_27,
        ]

        const prodArgoAddonConfig = createArgoAddonConfig('prod', 'https://github.com/howlla/eks-blueprints-workloads.git');

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
                   },
                   kustomizations: [
                       {kustomizationPath: "./eks-anywhere-common/Addons/Core"},
                       {kustomizationPath: "./eks-anywhere-common/Addons/Partner"}, 
                       {kustomizationPath: "./eks-cloud/Addons/Core"}, 
                       {kustomizationPath: "./eks-cloud/Addons/Partner"}
                   ],
              }],
            }),
            // new EksAnywhereSecretsAddon(),
            // prodArgoAddonConfig
          ]; 
          
            const blueprint = blueprints.EksBlueprint.builder()
            .account(account)
            .region(region)
            .addOns(...addons)
            
            const blueprintBuildersX86 = CLUSTER_VERSIONS.map((version) => 
            blueprint
            .clusterProvider(new blueprints.MngClusterProvider({
                instanceTypes: [new ec2.InstanceType("m5.xlarge")],
                amiType: eks.NodegroupAmiType.AL2_X86_64,
                desiredSize: 2,
                maxSize: 3,
            }))
            .version(version)
        )
  
          const blueprintBuildersArm = CLUSTER_VERSIONS.map((version) =>  blueprint
          .clusterProvider(new blueprints.MngClusterProvider({
              instanceTypes: [new ec2.InstanceType("m7g.xlarge")],
              amiType: eks.NodegroupAmiType.AL2_ARM_64,
              desiredSize: 2,
              maxSize: 3,
          }))
          .version(version)
      )
      const gitRepositoryName = 'cdk-eks-blueprints-patterns';

        blueprints.CodePipelineStack.builder()
        .application('npx ts-node bin/multi-cluster-conformitron.ts')
        .name('multi-cluster-central-pipeline')
        .owner('Howlla')
        .codeBuildPolicies(blueprints.DEFAULT_BUILD_POLICIES)
        .repository({
            repoUrl: gitRepositoryName,
            credentialsSecretName: 'github-token',
            targetRevision: 'conformitronInitiative',
        })
        .wave({
                id: "prod-test",
                stages: [
                    {
                        id: X86_ENV_ID + `-1`,
                        stackBuilder:  blueprintBuildersX86[0]
                            .clone(region, account)
                            .addOns(prodArgoAddonConfig)
                    },
                    // {
                    //     id: X86_ENV_ID + `-2`,
                    //     stackBuilder:  blueprintBuildersX86[1]
                    //         .clone(region, account)
                    // },
                    // {
                    //     id: X86_ENV_ID + `-3`,
                    //     stackBuilder:  blueprintBuildersX86[2]
                    //         .clone(region, account)
                    // },
                    // {
                    //     id: X86_ENV_ID + `-4`,
                    //     stackBuilder:  blueprintBuildersX86[3]
                    //         .clone(region, account)
                    // },
                    {
                        id: ARM_ENV_ID + `-1`,
                        stackBuilder:  blueprintBuildersArm[0]
                            .clone(region, account)
                            .addOns(prodArgoAddonConfig)

                    },
                    // {
                    //     id: ARM_ENV_ID + `-2`,
                    //     stackBuilder:  blueprintBuildersArm[1]
                    //         .clone(region, account)
                    // },
                    // {
                    //     id: ARM_ENV_ID + `-3`,
                    //     stackBuilder:  blueprintBuildersArm[2]
                    //         .clone(region, account)
                    // },
                    // {
                    //     id: ARM_ENV_ID + `-4`,
                    //     stackBuilder:  blueprintBuildersArm[3]
                    //         .clone(region, account)
                    // },
                ],
            })
            .build(scope, "multi-cluster-central-pipeline", {
                env: {
                    account: process.env.CDK_DEFAULT_ACCOUNT,
                    region: process.env.CDK_DEFAULT_REGION,
                }
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
    );
}