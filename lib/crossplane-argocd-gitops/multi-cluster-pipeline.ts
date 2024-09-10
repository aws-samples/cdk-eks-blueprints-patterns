import { Construct } from "constructs";
import * as blueprints from '@aws-quickstart/eks-blueprints';
import {K8S_VERSIONS_DEV, MultiClusterOptions} from "./multi-cluster-options";
import {CapacityType, KubernetesVersion} from "aws-cdk-lib/aws-eks";
import {NodegroupAmiType} from "aws-cdk-lib/aws-eks";
import * as eks from "aws-cdk-lib/aws-eks";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import ManagementClusterBuilder from "./management-cluster-builder";
import {GenericClusterProvider, LookupRoleProvider} from "@aws-quickstart/eks-blueprints";
import {IRole} from "aws-cdk-lib/aws-iam";
import * as iam from 'aws-cdk-lib/aws-iam';
import {ManagedNodeGroup} from "@aws-quickstart/eks-blueprints/dist/cluster-providers/types";
import { prevalidateSecrets } from "../common/construct-utils";
import {CreateNamedRoleProvider} from "./custom-addons/custom-iam-role-creator";

// const account = process.env.CDK_DEFAULT_ACCOUNT ?? "";
const account = process.env.CDK_DEFAULT_ACCOUNT!;
//const region = process.env.CDK_DEFAULT_REGION ?? "us-east-1";
const region = process.env.CDK_DEFAULT_REGION!;
const minSize  =  parseInt(process.env.NODEGROUP_MIN ?? "1");
const maxSize  =  parseInt(process.env.NODEGROUP_MAX ?? "3");
const desiredSize  =  parseInt(process.env.NODEGROUP_DESIRED ?? "1");
const gitHubSecret = process.env.GITHUB_SECRET ?? "cdk_blueprints_github_secret";

const props : MultiClusterOptions = {
    account,
    region,
    minSize,
    maxSize,
    desiredSize,
    gitHubSecret,
    nodeGroupCapacityType: CapacityType.ON_DEMAND,
    k8sVersions: K8S_VERSIONS_DEV // K8S_VERSIONS_PROD for full deploy
};


const mngProps: blueprints.MngClusterProviderProps = {
    version: KubernetesVersion.V1_29,
    instanceTypes: [ec2.InstanceType.of(ec2.InstanceClass.M5, ec2.InstanceSize.XLARGE2)],
    amiType: eks.NodegroupAmiType.AL2_X86_64,
    desiredSize: 2,
    maxSize: 3,
};

console.info("Running CDK with id: crossplane-argocd-gitops" );
console.info("Running CDK with: " + JSON.stringify(props));

export default class MultiClusterPipelineConstruct {
    async buildAsync(scope: Construct, id: string) {
        const k8sVersions = props.k8sVersions ?? K8S_VERSIONS_DEV;
        const region :string = props.region;
        const account : string = props.account;

        const gitProps = {
            owner :'ajpaws',
            secretName : props.gitHubSecret ?? 'cdk_blueprints_github_secret',
            repoName : 'cdk-eks-blueprints-patterns',
            revision : 'main' // use this to target a certain branch for deployment
        };


        await prevalidateSecrets(gitProps.secretName, region);

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

        const eksConnectorRole = new CreateNamedRoleProvider("eks-workload-connector-role", "eks-workload-connector-role", new iam.AccountPrincipal(account),
            [
                iam.ManagedPolicy.fromAwsManagedPolicyName("AdministratorAccess")
            ]);

        const baseBlueprintARM = blueprints.EksBlueprint.builder()
            .resourceProvider(blueprints.GlobalResources.Vpc, vpcProvider)
            .resourceProvider('eks-workload-connector-role',  eksConnectorRole)                  
            .account(account)
            .addOns(...addOns)
            .useDefaultSecretEncryption(true);

        const baseBlueprintAMD = blueprints.EksBlueprint.builder()
            .resourceProvider(blueprints.GlobalResources.Vpc, vpcProvider)
            .resourceProvider('eks-workload-connector-role',  new LookupRoleProvider('eks-workload-connector-role'))              
            .account(account)
            .addOns(...addOns)
            .useDefaultSecretEncryption(true);

            
        const mgmtCluster = new ManagementClusterBuilder(account, region)
            .create(scope, 'mgmt-cluster', mngProps)
            .account(account)
            .region(region)
            .resourceProvider(blueprints.GlobalResources.Vpc, vpcProvider);

        const mgmtStage = [{id: `mgmt-cluster-stage` , stackBuilder: mgmtCluster}];

        for(const k8sVersion of k8sVersions) {
            baseBlueprintARM.version(k8sVersion);

            const blueprintAMD = baseBlueprintAMD
                .clusterProvider(
                    new GenericClusterProvider( {
                        version: k8sVersion,
                        mastersRole: blueprints.getNamedResource('eks-workload-connector-role') as IRole,                      
                        managedNodeGroups : [addManagedNodeGroup( 'amd-tst-ng',{...clusterProps,
                            amiType : NodegroupAmiType.AL2_X86_64,
                            instanceTypes: [ec2.InstanceType.of(ec2.InstanceClass.M5, ec2.InstanceSize.XLARGE)]})]
                    })
                );
            stages.push({
                id: `workload-amd-` + k8sVersion.version.replace(".", "-"),
                stackBuilder : blueprintAMD.clone(props.region).id(`amd-` + k8sVersion.version.replace(".", "-"))
            });

            const blueprintARM = baseBlueprintARM
                .clusterProvider(
                    new GenericClusterProvider( {
                        version: k8sVersion,
                        mastersRole: blueprints.getNamedResource('eks-workload-connector-role') as IRole,
                        managedNodeGroups : [addManagedNodeGroup('arm-tst-ng',{...clusterProps,
                            amiType : NodegroupAmiType.AL2_ARM_64,
                            instanceTypes: [ec2.InstanceType.of(ec2.InstanceClass.M7G, ec2.InstanceSize.XLARGE)]})]
                    })
                );
            stages.push({
                id: `workload-arm-` + k8sVersion.version.replace(".", "-"),
                stackBuilder : blueprintARM.clone(props.region).id(`arm-` + k8sVersion.version.replace(".", "-"))
            });
        }

        blueprints.CodePipelineStack.builder()
            .application('npx ts-node bin/crossplane-argocd-gitops.ts')
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
                repoUrl: gitProps.repoName,
                trigger: blueprints.GitHubTrigger.POLL
            }
            )
            .wave({ id: `mgmt-cluster-stage`, stages: mgmtStage })
            .wave({ id: `${id}-wave`, stages })
            .build(scope, id, { env: { account, region } });
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
