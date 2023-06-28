import { Construct } from "constructs";
import * as blueprints from "@aws-quickstart/eks-blueprints";
import { TeamRikerSetup, TeamScan } from "../teams";

export class ImportClusterConstruct {

    /**
     * Create a blueprint that imports an existing cluster. 
     * @param scope stack scope
     */
    async build(scope: Construct) {

        /* 
         *Modify these constants for your use case.
        */
        const clusterName = "quickstart-cluster";
        const kubectlRoleName = "awsqs-kubernetes-helm"; 
        const region = process.env.CDK_DEFAULT_REGION!;

        const sdkCluster = await blueprints.describeCluster(clusterName, region);

        /**
         * Assumes the supplied role is registered in the target cluster for kubectl access.
         */
        const importClusterProvider = blueprints.ImportClusterProvider.fromClusterAttributes(sdkCluster, blueprints.getResource(context =>
            new blueprints.LookupRoleProvider(kubectlRoleName).provide(context)));
        
        const vpcId = sdkCluster.resourcesVpcConfig?.vpcId;

        blueprints.EksBlueprint.builder()
            .clusterProvider(importClusterProvider)
            .resourceProvider(blueprints.GlobalResources.Vpc, new blueprints.VpcProvider(vpcId)) // Important! register cluster VPC
            .addOns(new blueprints.CalicoOperatorAddOn())
            .addOns(new blueprints.AppMeshAddOn())
            .teams(new TeamRikerSetup(scope, "./lib/teams/team-riker/"))
            .teams(new TeamScan())
            .build(scope, "imported-cluster");
    }
}