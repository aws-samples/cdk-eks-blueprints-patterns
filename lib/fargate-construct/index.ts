import { Construct } from 'constructs';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as blueprints from '@aws-quickstart/eks-blueprints'
import * as team from '../teams'

/**
 * Demonstrates how to use Fargate cluster provider.
 * Along with the specified profiles, Fargate cluster automatically creates
 * a default profile with selectors for the default namespace.
 */
export default class FargateConstruct {
    constructor(scope: Construct, id: string) {
        // Setup platform team
        const accountID = process.env.CDK_DEFAULT_ACCOUNT!
        const platformTeam = new team.TeamPlatform(accountID)
       
        const fargateProfiles: Map<string, eks.FargateProfileOptions> = new Map([
            ["team1", { selectors: [{ namespace: "team1" }] }]
        ]);

        const stackID = `${id}-blueprint`
        const clusterProvider = new blueprints.FargateClusterProvider({
            fargateProfiles,
            version: eks.KubernetesVersion.V1_25
        });

        blueprints.EksBlueprint.builder()
            .account(accountID)
            .region(process.env.CDK_DEFAULT_REGION!)
            .resourceProvider(blueprints.GlobalResources.Vpc, new blueprints.VpcProvider("vpc-0e6c1a572e50aa1fb"))
            .clusterProvider(clusterProvider)
            .teams(platformTeam)
            .addOns(
                new blueprints.VpcCniAddOn(),
                new blueprints.AwsLoadBalancerControllerAddOn,
                new blueprints.AppMeshAddOn,
                new blueprints.NginxAddOn,
                new blueprints.ArgoCDAddOn,
                new blueprints.MetricsServerAddOn
            )
            .build(scope, stackID);
    }
}



