import * as blueprints from '@aws-quickstart/eks-blueprints';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import MultiClusterBuilderConstruct from './multi-cluster-builder';
import { GrafanaMonitoringConstruct } from './grafana-monitor-builder';
import { ClusterName, clusterMappings } from './clusterMapping';

/**
 * Main multi-cluster deployment pipeline.
 */
export class PipelineMultiCluster {

    async buildAsync(scope: Construct) {
        const accountID = process.env.ACCOUNT_ID! || process.env.CDK_DEFAULT_ACCOUNT! ;
        const region = process.env.AWS_REGION! || process.env.CDK_DEFAULT_REGION!;

        const versions = blueprints.utils.valueFromContext(scope, "conformitron.versions", ["1.30","1.31","1.32"]);

        const CLUSTER_VERSIONS = versions.map((v: string) => eks.KubernetesVersion.of(v));

        // Stages in codepipeline
        const stages : blueprints.StackStage[] = [];

        const blueprintGrafanaConstruct = new GrafanaMonitoringConstruct();
        const blueprintGrafana = blueprintGrafanaConstruct.create(scope, accountID, region);

        stages.push({
            id: ClusterName.MONITORING,
            stackBuilder: blueprintGrafana
                .clone(region, accountID)
        });

        /* TODO: Seperate region for clusters than infra account region, 
           trust policy is created when pipeline is bootstrapped.
           It will be helpful for enterprise customers.
           Similar to approach in multi-region-construct pattern
        */

        let clusterProps: blueprints.MngClusterProviderProps;

        for(const version of CLUSTER_VERSIONS) {
            const blueprintBuilderX86 = new MultiClusterBuilderConstruct().create(scope, accountID, region);
            
            clusterProps = this.buildClusterProps(
                clusterMappings[ClusterName.X86]!.amiType,
                clusterMappings[ClusterName.X86]!.instanceType
            );
            
            const blueprintX86 = blueprintBuilderX86
                .version(version)
                .clusterProvider(new blueprints.MngClusterProvider(clusterProps))
                .useDefaultSecretEncryption(true);
    
            stages.push({
                id: ClusterName.X86 + "-" + version.version.replace(".", "-"),
                stackBuilder : blueprintX86.clone(region)
            });

            const blueprintBuilderArm = new MultiClusterBuilderConstruct().create(scope, accountID, region);
            clusterProps = this.buildClusterProps(
                clusterMappings[ClusterName.ARM]!.amiType,
                clusterMappings[ClusterName.ARM]!.instanceType
            );
            const blueprintARM = blueprintBuilderArm
                .version(version)
                .clusterProvider(new blueprints.MngClusterProvider(clusterProps))
                .useDefaultSecretEncryption(true);
                        
            stages.push({
                id: ClusterName.ARM  + "-" + version.version.replace(".", "-"),
                stackBuilder : blueprintARM.clone(region)
            });
        }

        // Only deploy lates kube version on BR Clusters
        const LATEST_VERSION = CLUSTER_VERSIONS.at(CLUSTER_VERSIONS.length-1)!;
    
        const blueprintBuilderBrX86= new MultiClusterBuilderConstruct().create(scope, accountID, region);

        clusterProps = this.buildClusterProps(
            clusterMappings[ClusterName.BR_X86]!.amiType,
            clusterMappings[ClusterName.BR_X86]!.instanceType
        );

        const blueprintBrX86 = blueprintBuilderBrX86
            .version(LATEST_VERSION)
            .clusterProvider(new blueprints.MngClusterProvider(clusterProps))
            .useDefaultSecretEncryption(true);
    
        stages.push({
            id: ClusterName.BR_X86 + "-" + LATEST_VERSION.version.replace(".", "-"),
            stackBuilder : blueprintBrX86.clone(region)
        });

        const blueprintBuilderBrArm = new MultiClusterBuilderConstruct().create(scope, accountID, region);
        
        clusterProps = this.buildClusterProps(
            clusterMappings[ClusterName.BR_ARM]!.amiType,
            clusterMappings[ClusterName.BR_ARM]!.instanceType
        );

        const blueprintBottleRocketArm = blueprintBuilderBrArm
            .version(LATEST_VERSION)
            .clusterProvider(new blueprints.MngClusterProvider(clusterProps))
            .useDefaultSecretEncryption(true);
    
        stages.push({
            id: ClusterName.BR_ARM + "-" + LATEST_VERSION.version.replace(".", "-"),
            stackBuilder : blueprintBottleRocketArm.clone(region)
        });

        const gitOwner = 'mikemcd3912';
        const gitRepositoryName = 'cdk-eks-blueprints-patterns';

        blueprints.CodePipelineStack.builder()
            .application('npx ts-node bin/multi-cluster-conformitron.ts')
            .name('multi-cluster-central-pipeline')
            .owner(gitOwner)
            .codeBuildPolicies(blueprints.DEFAULT_BUILD_POLICIES)
            .repository({
                repoUrl: gitRepositoryName,
                credentialsSecretName: 'github-token',
                targetRevision: 'conformitron-pipeline',
                trigger: blueprints.GitHubTrigger.POLL
            })
            .wave({
                id: "prod-test",
                stages
            })
            .build(scope, "multi-cluster-central-pipeline", {
                env: {
                    account: process.env.CDK_DEFAULT_ACCOUNT,
                    region: region,
                }
            });
    }
    buildClusterProps(amiType:eks.NodegroupAmiType,instanceType:ec2.InstanceType) : blueprints.MngClusterProviderProps{
        let clusterProps : blueprints.MngClusterProviderProps = {
            maxSize : 2,
            minSize : 1,
            desiredSize: 1,
            diskSize: 100,
            amiType: amiType,
            instanceTypes:[instanceType]
        };
        return clusterProps;
    }
}
