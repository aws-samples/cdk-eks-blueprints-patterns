// Blueprints Lib
import * as blueprints from '@aws-quickstart/eks-blueprints';
import { utils } from '@aws-quickstart/eks-blueprints';
import { KubernetesVersion } from 'aws-cdk-lib/aws-eks';
import { Construct } from 'constructs';

// Team implementations
import * as team from '../teams';
const burnhamManifestDir = './lib/teams/team-burnham/';
const rikerManifestDir = './lib/teams/team-riker/';
const teamManifestDirList = [burnhamManifestDir,rikerManifestDir];

export const SECRET_GIT_SSH_KEY = 'github-ssh-key';
export const SECRET_ARGO_ADMIN_PWD = 'argo-admin-secret';


/**
 * This pattern demonstrates how to roll out a platform across multiple regions and multiple stages.
 * Each region represents a stage in the development process, i.e. dev, test, prod. 
 * To use this pattern as is you need to create the following secrets in us-east-1 and replicate them to us-east-2 and us-west-2:
 * - github-ssh-test - containing SSH key for github authentication (plaintext in AWS Secrets manager)
 * - argo-admin-secret - containing the initial admin secret for ArgoCD (e.g. CLI and UI access)
 */
export default class MultiRegionConstruct {

    async buildAsync(scope: Construct, id: string) : Promise<blueprints.EksBlueprint[]> {
        // Setup platform team
        const accountID = process.env.CDK_DEFAULT_ACCOUNT!;
        const gitUrl = 'https://github.com/aws-samples/eks-blueprints-workloads.git';
        const gitSecureUrl = 'git@github.com:aws-samples/eks-blueprints-workloads.git';

        await prevalidateSecrets(); // this checks if required secrets exist in the target regions
        
        const blueprint = blueprints.EksBlueprint.builder()
            .account(process.env.CDK_DEFAULT_ACCOUNT!)
            .clusterProvider(new blueprints.MngClusterProvider({
                version: KubernetesVersion.V1_25,
                desiredSize: 2,
                maxSize: 3
            }))
            .addOns(
                new blueprints.AwsLoadBalancerControllerAddOn,
                new blueprints.CertManagerAddOn,
                new blueprints.AdotCollectorAddOn,
                new blueprints.NginxAddOn,
                new blueprints.CalicoOperatorAddOn,
                new blueprints.MetricsServerAddOn,
                new blueprints.VpcCniAddOn,
                new blueprints.KarpenterAddOn,
                new blueprints.CloudWatchAdotAddOn,
                new blueprints.XrayAdotAddOn,
                new blueprints.SecretsStoreAddOn )
            .teams( new team.TeamPlatform(accountID),
                new team.TeamTroiSetup,
                new team.TeamRikerSetup(scope, teamManifestDirList[1]),
                new team.TeamBurnhamSetup(scope,teamManifestDirList[0]));

        const devBootstrapArgo = new blueprints.ArgoCDAddOn({
            bootstrapRepo: {
                repoUrl: gitUrl,
                path: 'envs/dev'
            }
        });

        const testBootstrapArgo = new blueprints.ArgoCDAddOn({
            bootstrapRepo: {
                repoUrl: gitSecureUrl,
                path: 'envs/test',
                credentialsSecretName: SECRET_GIT_SSH_KEY,
                credentialsType: 'SSH'
            },
        });

        const prodBootstrapArgo = new blueprints.ArgoCDAddOn({
            bootstrapRepo: {
                repoUrl: gitSecureUrl,
                path: 'envs/prod',
                credentialsSecretName: SECRET_GIT_SSH_KEY,
                credentialsType: 'SSH'
            },
            adminPasswordSecretName: SECRET_ARGO_ADMIN_PWD,
        });
        
        const east1 = await blueprint.clone('us-east-1')
            .addOns(devBootstrapArgo)
            .buildAsync(scope,  `${id}-us-east-1`);
        
        const east2 = await blueprint.clone('us-east-2')
            .addOns(testBootstrapArgo)
            .buildAsync(scope, `${id}-us-east-2`);
        
        const west2 = await blueprint.clone('us-west-2')
            .addOns(prodBootstrapArgo)
            .buildAsync(scope, `${id}-us-west-2`);

        return [ east1, east2, west2 ];
    }
}

async function prevalidateSecrets() {
    try {
        await utils.validateSecret(SECRET_GIT_SSH_KEY, 'us-east-2');
        await utils.validateSecret(SECRET_ARGO_ADMIN_PWD, 'us-west-2');
    }
    catch(error) {
        throw new Error("Both github-ssh-key and argo-admin-secret secrets must be setup for the multi-region pattern to work.");
    }
}


