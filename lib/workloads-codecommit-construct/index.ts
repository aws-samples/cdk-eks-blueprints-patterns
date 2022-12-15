import { Construct } from 'constructs';
import * as blueprints from '@aws-quickstart/eks-blueprints'

/**
 * Demonstrates how to use AWS CodeCommmit as a repository for ArgoCD workloads.
 */
export default class WorkloadsCodeCommitConstruct {
    constructor(scope: Construct, id: string) {
        const account = process.env.CDK_DEFAULT_ACCOUNT!
        const region = process.env.CDK_DEFAULT_REGION!;
        // const platformTeam = new team.TeamPlatform(account)

        const repoName = 'eks-blueprints-workloads-cc';
        const repoUrl = 'https://git-codecommit.' + region + '.amazonaws.com/v1/repos/' + repoName;
    
        const bootstrapRepo : blueprints.ApplicationRepository = {
            repoUrl,
            targetRevision: 'master',
        }
    
        // HERE WE GENERATE THE ADDON CONFIGURATIONS
        const devSecretStore = new blueprints.SecretsStoreAddOn({
        });
        const devBootstrapArgo = new blueprints.ArgoCDAddOn({
            bootstrapRepo: {
                ...bootstrapRepo,
                path: 'envs/dev',
            },
            values: { server: {service: { type: "LoadBalancer"} } }
        });

        const stackID = `${id}-dev-blueprint-${region}`

        blueprints.EksBlueprint.builder()
            .account(account)
            .region(region)
            // .teams(platformTeam)
            .addOns(devSecretStore, devBootstrapArgo)
            .build(scope, stackID);
    }
}
