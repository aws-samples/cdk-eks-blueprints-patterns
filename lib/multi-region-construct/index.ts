import * as cdk from '@aws-cdk/core';

// SSP Lib
import * as ssp from '@shapirov/cdk-eks-blueprint'
import { ArgoCDAddOn, AsyncStackBuilder, EksBlueprint } from '@shapirov/cdk-eks-blueprint';

// Team implementations
import * as team from '../teams'


/**
 * This pattern demonstrates how to roll out a platform across multiple regions and multiple stages.
 * Each region represents a stage in the development process, i.e. dev, test, prod. 
 * To use this pattern as is you need to create the following secrets in us-east-1 and replicate them to us-east-2 and us-west-2:
 * - github-ssh-test - containing SSH key for github authentication (plaintext in AWS Secrets manager)
 * - argo-admin-secret - containing the initial admin secret for ArgoCD (e.g. CLI and UI access)
 */
export default class MultiRegionConstruct {

    static readonly SECRET_GIT_SSH_KEY = 'github-ssh-key';
    static readonly SECRET_ARGO_ADMIN_PWD = 'argo-admin-secret';

    async buildAsync(scope: cdk.Construct, id: string) : Promise<EksBlueprint[]> {
        // Setup platform team
        const accountID = process.env.CDK_DEFAULT_ACCOUNT!;
        const gitUrl = 'https://github.com/aws-samples/ssp-eks-workloads.git';

        try {
            getSecretValue(MultiRegionConstruct.SECRET_GIT_SSH_KEY, accountID);
            getSecretValue(MultiRegionConstruct.SECRET_ARGO_ADMIN_PWD, accountID);
        }
        catch(error) {
            throw new Error("Both github-ssh-key and argo-admin-secret secrets must be setup for the multi-region pattern to work.");
        }

        const blueprint = ssp.EksBlueprint.builder()
            .account(process.env.CDK_DEFAULT_ACCOUNT!)
            .addons(new ssp.NginxAddOn,
                new ssp.CalicoAddOn,
                new ssp.MetricsServerAddOn,
                new ssp.ClusterAutoScalerAddOn,
                new ssp.ContainerInsightsAddOn)
            .teams( new team.TeamPlatform(accountID),
                new team.TeamTroiSetup,
                new team.TeamRikerSetup,
                new team.TeamBurnhamSetup(scope));

        const devBootstrapArgo = new ArgoCDAddOn({
            bootstrapRepo: {
                repoUrl: gitUrl,
                path: 'envs/dev'
            }
        });

        const testBootstrapArgo = new ArgoCDAddOn({
            bootstrapRepo: {
                repoUrl: 'git@github.com:aws-samples/ssp-eks-workloads.git',
                path: 'envs/test',
                credentialsSecretName: MultiRegionConstruct.SECRET_GIT_SSH_KEY,
                credentialsType: 'SSH'
            },
        });

        const prodBootstrapArgo = new ArgoCDAddOn({
            bootstrapRepo: {
                repoUrl: 'git@github.com:aws-samples/ssp-eks-workloads.git',
                path: 'envs/prod',
                credentialsSecretName: MultiRegionConstruct.SECRET_GIT_SSH_KEY,
                credentialsType: 'SSH'
            },
            adminPasswordSecretName: MultiRegionConstruct.SECRET_ARGO_ADMIN_PWD,
        });
        
        const east1 = await blueprint.clone('us-east-1')
            .addons(devBootstrapArgo)
            .buildAsync(scope,  `${id}-us-east-1`);
        
        const east2 = await blueprint.clone('us-east-2')
            .addons(testBootstrapArgo)
            .buildAsync(scope, `${id}-us-east-2`);
        
        const west2 = await blueprint.clone('us-west-2')
            .addons(prodBootstrapArgo)
            .buildAsync(scope, `${id}-us-west-2`);

        return [east1, east2, west2];
    }
}
function getSecretValue(SECRET_GIT_SSH_KEY: string, accountID: string) {
    throw new Error('Function not implemented.');
}

