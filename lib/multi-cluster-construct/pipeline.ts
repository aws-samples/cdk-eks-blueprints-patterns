import * as blueprints from '@aws-quickstart/eks-blueprints';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import MultiClusterBuilderConstruct from './multi-cluster-builder';
import GrafanaMonitoringConstruct from './grafana-monitor-builder';


/**
 * Main multi-cluster deployment pipeline.
 */
export class PipelineMultiCluster {

    async buildAsync(scope: Construct) {
        const accountID = process.env.CDK_DEFAULT_ACCOUNT! ;
        const region = "us-west-2" ;

        // environments IDs consts
        const X86_ENV_ID = `eks-x86-`;
        const ARM_ENV_ID = `eks-arm-`;
        const BR_ENV_ID = `eks-br-`;


        const CLUSTER_VERSIONS = [
            eks.KubernetesVersion.V1_26,
            eks.KubernetesVersion.V1_27,
            eks.KubernetesVersion.V1_28
        ];


        const stages : blueprints.StackStage[] = [];

        for(const version of CLUSTER_VERSIONS) {
            const clusterProps = this.getClusterProps()
            const blueprint1 = new MultiClusterBuilderConstruct().create(scope,`X86-` + version.version.replace(".", "-"), accountID, region);

            clusterProps.amiType = eks.NodegroupAmiType.AL2_X86_64;
            clusterProps.instanceTypes  =  [ec2.InstanceType.of(ec2.InstanceClass.M5, ec2.InstanceSize.XLARGE2)];
            const blueprintX86 = blueprint1
                .version(version)
                .clusterProvider(new blueprints.MngClusterProvider(clusterProps))
                .useDefaultSecretEncryption(true);
    
            stages.push({
                id: `${X86_ENV_ID}-` + version.version.replace(".", "-"),
                stackBuilder : blueprintX86.clone(region)
            });

            const blueprint2 = new MultiClusterBuilderConstruct().create(scope,`ARM-` + version.version.replace(".", "-"), accountID, region);
            clusterProps.amiType = eks.NodegroupAmiType.AL2_ARM_64;
            clusterProps.instanceTypes  =  [ec2.InstanceType.of(ec2.InstanceClass.M7G, ec2.InstanceSize.XLARGE2)];
            const blueprintARM = blueprint2
                .version(version)
                .clusterProvider(new blueprints.MngClusterProvider(clusterProps))
                .useDefaultSecretEncryption(true);
                        
            stages.push({
                id: `${ARM_ENV_ID}-` + version.version.replace(".", "-"),
                stackBuilder : blueprintARM.clone(region)
            });
        }

        const latestVersion = CLUSTER_VERSIONS.at(CLUSTER_VERSIONS.length-1)!;
    
        const blueprint3 = new MultiClusterBuilderConstruct().create(scope,`BR-X86-` + latestVersion.version.replace(".", "-"), accountID, region);

        let clusterProps = this.getClusterProps()
        clusterProps.amiType = eks.NodegroupAmiType.BOTTLEROCKET_X86_64;
        clusterProps.instanceTypes  =  [ec2.InstanceType.of(ec2.InstanceClass.M5, ec2.InstanceSize.XLARGE2)];
        const blueprintBottleRocketX86 = blueprint3
            .version(latestVersion)
            .clusterProvider(new blueprints.MngClusterProvider(clusterProps))
            .useDefaultSecretEncryption(true);
    
        stages.push({
            id: `${BR_ENV_ID}-X86` + latestVersion.version.replace(".", "-"),
            stackBuilder : blueprintBottleRocketX86.clone(region)
        });

        const blueprint4 = new MultiClusterBuilderConstruct().create(scope,`BR-ARM-` + latestVersion.version.replace(".", "-"), accountID, region);
        
        clusterProps = this.getClusterProps()
        clusterProps.amiType = eks.NodegroupAmiType.BOTTLEROCKET_ARM_64;
        clusterProps.instanceTypes  =  [ec2.InstanceType.of(ec2.InstanceClass.M7G, ec2.InstanceSize.XLARGE2)];
        const blueprintBottleRocketArm = blueprint4
            .version(latestVersion)
            .clusterProvider(new blueprints.MngClusterProvider(clusterProps))
            .useDefaultSecretEncryption(true);
    
        stages.push({
            id: `${BR_ENV_ID}-ARM` + latestVersion.version.replace(".", "-"),
            stackBuilder : blueprintBottleRocketArm.clone(region)
        });

        const blueprintGrafana = new GrafanaMonitoringConstruct().create(scope, accountID, region);

        stages.push({
            id: 'Grafana-Monitoring',
            stackBuilder: blueprintGrafana
                .clone(region, accountID)
        });

        const gitOwner = 'Howlla';
        const gitRepositoryName = 'cdk-eks-blueprints-patterns';

        blueprints.CodePipelineStack.builder()
            .application('npx ts-node bin/multi-cluster-conformitron.ts')
            .name('multi-cluster-central-pipeline')
            .owner(gitOwner)
            .codeBuildPolicies(blueprints.DEFAULT_BUILD_POLICIES)
            .repository({
                repoUrl: gitRepositoryName,
                credentialsSecretName: 'github-token1',
                targetRevision: 'test4',

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

    getClusterProps() {
        const clusterProps : blueprints.MngClusterProviderProps = {
            maxSize : 1,
            minSize : 1,
            desiredSize: 1
        };
        return clusterProps
      }
}
