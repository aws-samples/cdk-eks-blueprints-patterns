import * as cdk from '@aws-cdk/core';

// SSP Lib
import * as ssp from '@aws-quickstart/ssp-amazon-eks';
import { getSecretValue } from '@aws-quickstart/ssp-amazon-eks/dist/utils/secrets-manager-utils';

// Team implementations
import * as team from '../teams'
const burnhamManifestDir = './lib/teams/team-burnham/'
const rikerManifestDir = './lib/teams/team-riker/'
const teamManifestDirList = [burnhamManifestDir,rikerManifestDir]

/**
 * This pattern demonstrates how to roll out a platform across multiple regions and multiple stages.
 * Each region represents a stage in the development process, i.e. dev, test, prod. 
 * To use this pattern as is you need to create the following secrets in us-east-1 and replicate them to us-east-2 and us-west-2:
 * - github-ssh-test - containing SSH key for github authentication (plaintext in AWS Secrets manager)
 * - argo-admin-secret - containing the initial admin secret for ArgoCD (e.g. CLI and UI access)
 */
export default class MultiRegionConstruct {

    static readonly SECRET_GIT_SSH_KEY = 'github-ssh-key';
     static readonly SECRET_GIT_TOKEN = 'github-token-kv';
    static readonly SECRET_ARGO_ADMIN_PWD = 'argo-admin-secret';

    async buildAsync(scope: cdk.Construct, id: string) : Promise<ssp.EksBlueprint[]> {
        // Setup platform team
        const accountID = process.env.CDK_DEFAULT_ACCOUNT!;
        const gitUrl = 'https://github.com/allamand/ssp-eks-workloads.git';
        //const gitSecureUrl = 'git@github.com:aws-samples/ssp-eks-workloads.git';

        try {
            await getSecretValue(MultiRegionConstruct.SECRET_GIT_TOKEN, 'eu-west-1');
            await getSecretValue(MultiRegionConstruct.SECRET_ARGO_ADMIN_PWD, 'eu-west-1');
        }
        catch(error) {
            throw new Error("Both github-ssh-key and argo-admin-secret secrets must be setup for the multi-region pattern to work.");
        }
        
        const blueprint = ssp.EksBlueprint.builder()
            .account(process.env.CDK_DEFAULT_ACCOUNT!)
            .addOns( new ssp.AwsLoadBalancerControllerAddOn,
                new ssp.NginxAddOn,
                new ssp.CalicoAddOn,
                new ssp.MetricsServerAddOn,
                new ssp.ClusterAutoScalerAddOn,
                new ssp.ContainerInsightsAddOn,
                new ssp.XrayAddOn,
                new ssp.SecretsStoreAddOn)
            .teams( new team.TeamPlatform(accountID),
                new team.TeamTroiSetup,
                new team.TeamRikerSetup(scope, teamManifestDirList[1]),
                new team.TeamBurnhamSetup(scope,teamManifestDirList[0]));


        const devBootstrapArgo = new ssp.ArgoCDAddOn({
            bootstrapRepo: {
                repoUrl: gitUrl,
                path: 'envs/dev',
                credentialsSecretName: MultiRegionConstruct.SECRET_GIT_TOKEN,
                credentialsType: 'TOKEN'
            }
        });

        // const testBootstrapArgo = new ssp.ArgoCDAddOn({
        //     bootstrapRepo: {
        //         //repoUrl: gitSecureUrl,
        //         repoUrl: gitUrl,
        //         path: 'envs/test',
        //          credentialsSecretName: MultiRegionConstruct.SECRET_GIT_TOKEN,
        //         // credentialsType: 'SSH'
        //         credentialsType: 'TOKEN'
        //     },
        // });

        // const prodBootstrapArgo = new ssp.ArgoCDAddOn({
        //     bootstrapRepo: {
        //         repoUrl: gitUrl,
        //         path: 'envs/prod',
        //         credentialsSecretName: MultiRegionConstruct.SECRET_GIT_TOKEN,
        //         credentialsType: 'TOKEN'
        //     },
        //     adminPasswordSecretName: MultiRegionConstruct.SECRET_ARGO_ADMIN_PWD,
        // });
        
        const dev = await blueprint.clone('eu-west-3')
            //.addOns(devBootstrapArgo)
            .buildAsync(scope,  `${id}-dev`);
        
        // const test = await blueprint.clone('us-east-2')
        //     .addOns(testBootstrapArgo)
        //     .buildAsync(scope, `${id}-test`);
        
        // const prod = await blueprint.clone('eu-west-1')
        //     .addOns(prodBootstrapArgo)
        //     .buildAsync(scope, `${id}-prod`);

        return [ dev ];
        // return [ dev, test, prod ];
    }
}


