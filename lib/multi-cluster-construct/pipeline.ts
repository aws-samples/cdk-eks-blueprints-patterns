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
            eks.KubernetesVersion.V1_25,
            eks.KubernetesVersion.V1_26,
            eks.KubernetesVersion.V1_27,
        ]

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
          ]; 
            
            let clusterProps : blueprints.MngClusterProviderProps = {
                maxSize : 3,
                minSize : 1,
                desiredSize: 1
            };

            const stages : blueprints.StackStage[] = [];

            for(const version of CLUSTER_VERSIONS) {
                clusterProps.amiType = eks.NodegroupAmiType.AL2_X86_64;
                clusterProps.instanceTypes  =  [ec2.InstanceType.of(ec2.InstanceClass.M5, ec2.InstanceSize.XLARGE)];
                const blueprintX86 = blueprints.EksBlueprint.builder()
                    .account(account)
                    .version(version)
                    .clusterProvider(new blueprints.MngClusterProvider(clusterProps))
                    .useDefaultSecretEncryption(true)
                    .addOns(...addons);
    
                stages.push({
                    id: `${X86_ENV_ID}-` + version.version.replace(".", "-"),
                    stackBuilder : blueprintX86.clone(region)
                });
    
    
                clusterProps.amiType = eks.NodegroupAmiType.AL2_ARM_64;
                clusterProps.instanceTypes  =  [ec2.InstanceType.of(ec2.InstanceClass.M7G, ec2.InstanceSize.XLARGE)];
                const blueprintARM = blueprints.EksBlueprint.builder()
                    .account(account)
                    .version(version)
                    .clusterProvider(new blueprints.MngClusterProvider(clusterProps))
                    .useDefaultSecretEncryption(true)
                    .addOns(...addons);
                        
                stages.push({
                    id: `${ARM_ENV_ID}-` + version.version.replace(".", "-"),
                    stackBuilder : blueprintARM.clone(region)
                });
            }
      

        blueprints.CodePipelineStack.builder()
        .application('npx ts-node bin/multi-cluster-conformitron.ts')
        .name('multi-cluster-central-pipeline')
        .owner('Howlla')
        .codeBuildPolicies(blueprints.DEFAULT_BUILD_POLICIES)
        .repository({
            repoUrl: "cdk-eks-blueprints-patterns",
            credentialsSecretName: 'github-token',
            targetRevision: 'conformitronInitiative',
        })
        .wave({
                id: "prod-test",
                stages
            })
        .build(scope, "multi-cluster-central-pipeline", {
            env: {
                account: process.env.CDK_DEFAULT_ACCOUNT,
                region: process.env.CDK_DEFAULT_REGION,
            }
        });
    }
}
