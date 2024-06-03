import { Construct } from "constructs";
import * as blueprints from '@aws-quickstart/eks-blueprints';
import {K8S_VERSIONS_DEV, MultiClusterOptions} from "./multi-cluster-options";
import {NodegroupAmiType} from "aws-cdk-lib/aws-eks";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import ManagementClusterBuilder from "./management-cluster-builder";
import {ProviderMgmtRoleTeam} from "./custom-addons/mgmt-role-teams";
import {GenericClusterProvider, LookupRoleProvider} from "@aws-quickstart/eks-blueprints";
import {IRole} from "aws-cdk-lib/aws-iam";
import * as iam from 'aws-cdk-lib/aws-iam';
import {ManagedNodeGroup} from "@aws-quickstart/eks-blueprints/dist/cluster-providers/types";

export default class MultiClusterPipelineConstruct {
    async buildAsync(scope: Construct, id: string, props: MultiClusterOptions, mngProps: blueprints.MngClusterProviderProps) {
        const k8sVersions = props.k8sVersions ?? K8S_VERSIONS_DEV;
        const region :string = props.region;
        const account : string = props.account;

        const gitProps = {
            owner :'jalawala',
            secretName : props.gitHubSecret ?? 'github-access-eks-addon',
            repoName : 'aws-addon-clusters-main',
            revision : 'main' // use this to target a certain branch for deployment
        };


        await this.prevalidateSecrets(gitProps.secretName, region);

        const addOns: Array<blueprints.ClusterAddOn> = [
            new blueprints.ExternalsSecretsAddOn({
                namespace: "external-secrets",
                values: { webhook: { port: 9443 } }
            })
        ];

        const clusterProps: blueprints.MngClusterProviderProps = {
            minSize: props.minSize,
            maxSize: props.maxSize,
            desiredSize: props.desiredSize,
            nodeGroupCapacityType: props.nodeGroupCapacityType,
        };

        const stages : blueprints.StackStage[] = [];
        const vpcProvider= new blueprints.VpcProvider();

        const baseBlueprint = blueprints.EksBlueprint.builder()
            .resourceProvider(blueprints.GlobalResources.Vpc, vpcProvider)
            .resourceProvider('eks-connector-role',  new LookupRoleProvider('eks-connector-role'))
            .account(account)
            .addOns(...addOns)
            .teams(new ProviderMgmtRoleTeam(account))
            .useDefaultSecretEncryption(true);

        const mgmtCluster = new ManagementClusterBuilder(account, region)
            .create(scope, 'management-cluster', mngProps)
            .account(account)
            .region(region)
            .resourceProvider(blueprints.GlobalResources.Vpc, vpcProvider);

        const mgmtStage = [{id: `mgmt-cluster-stage` , stackBuilder: mgmtCluster}];

        for(const k8sVersion of k8sVersions) {
            baseBlueprint.version(k8sVersion);

            const blueprintAMD = baseBlueprint
                .clusterProvider(
                    new GenericClusterProvider( {
                        version: k8sVersion,
                        mastersRole: blueprints.getNamedResource('eks-connector-role') as IRole,
                        managedNodeGroups : [addManagedNodeGroup( 'amd-tst-ng',{...clusterProps,
                            amiType : NodegroupAmiType.AL2_X86_64,
                            instanceTypes: [ec2.InstanceType.of(ec2.InstanceClass.M5, ec2.InstanceSize.XLARGE)]})]
                    })
                );
            stages.push({
                id: `amd-` + k8sVersion.version.replace(".", "-"),
                stackBuilder : blueprintAMD.clone(props.region).id(`amd-` + k8sVersion.version.replace(".", "-"))
            });

            const blueprintARM = baseBlueprint
                .clusterProvider(
                    new GenericClusterProvider( {
                        version: k8sVersion,
                        mastersRole: blueprints.getNamedResource('eks-connector-role') as IRole,
                        managedNodeGroups : [addManagedNodeGroup('arm-tst-ng',{...clusterProps,
                            amiType : NodegroupAmiType.AL2_ARM_64,
                            instanceTypes: [ec2.InstanceType.of(ec2.InstanceClass.M7G, ec2.InstanceSize.XLARGE)]})]
                    })
                );
            stages.push({
                id: `arm-` + k8sVersion.version.replace(".", "-"),
                stackBuilder : blueprintARM.clone(props.region).id(`arm-` + k8sVersion.version.replace(".", "-"))
            });
        }

        blueprints.CodePipelineStack.builder()
            .name(id)
            .owner(gitProps.owner)
            .codeBuildPolicies(
                ([
                    new iam.PolicyStatement({
                        resources: ["*"],
                        actions: [
                            "codebuild:*",
                            "sts:AssumeRole",
                            "secretsmanager:GetSecretValue",
                            "secretsmanager:ListSecrets",
                            "secretsmanager:DescribeSecret",
                            "cloudformation:*"
                        ]
                    })
                ])
            )
            .repository({
                targetRevision : gitProps.revision,
                credentialsSecretName: gitProps.secretName,
                repoUrl: gitProps.repoName
            }
            )
            .wave({ id: `mgmt-cluster-stage`, stages: mgmtStage })
            .wave({ id: `${id}-wave`, stages })
            .build(scope, id, { env: { account, region } });
    }

    async prevalidateSecrets(secretName: string, region: string) {
        try {
            await blueprints.utils.validateSecret(secretName, region);
        }
        catch(error) {
            throw new Error(`${secretName} secret must be setup in AWS Secrets Manager in ${region} for the GitHub pipeline.
            * @see https://docs.aws.amazon.com/codepipeline/latest/userguide/GitHub-create-personal-token-CLI.html`);
        }
    }
}

function addManagedNodeGroup(id: string, clusterProps: blueprints.MngClusterProviderProps): ManagedNodeGroup {
    return  {
        id,
        minSize: clusterProps.minSize,
        maxSize: clusterProps.maxSize,
        amiType: clusterProps.amiType,
        instanceTypes: clusterProps.instanceTypes,
        desiredSize: clusterProps.desiredSize
    };
}
