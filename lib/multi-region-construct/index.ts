import * as cdk from '@aws-cdk/core';

// SSP Lib
import * as ssp from '@shapirov/cdk-eks-blueprint'
import { ArgoCDAddOn } from '@shapirov/cdk-eks-blueprint';

// Team implementations
import * as team from '../teams'


/**
 * This pattern demonstrates how to roll out a platform across multiple regions and multiple stages.
 * Each region represents a stage in the development process, i.e. dev, test, prod. 
 * To use this pattern as is you need to create the following secrets in us-east-1 and replicate them to us-east-2 and us-west-2:
 * - github-ssh-test - containing SSH key for github authentication (plaintext in AWS Secrets manager)
 * - argo-admin-secret - containing the initial admin secret for ArgoCD (e.g. CLI and UI access)
 */
export default class MultiRegionConstruct extends cdk.Construct {
    constructor(scope: cdk.Construct, id: string) {
        super(scope, id);

        // Setup platform team
        const accountID = process.env.CDK_DEFAULT_ACCOUNT!
        const platformTeam = new team.TeamPlatform(accountID)
        const teams: Array<ssp.Team> = [
            platformTeam,
            new team.TeamTroiSetup,
            new team.TeamRikerSetup,
            new team.TeamBurnhamSetup(scope)
        ];

        // AddOns for the cluster.
        const addOns: Array<ssp.ClusterAddOn> = [
            new ssp.NginxAddOn,
            new ssp.CalicoAddOn,
            new ssp.MetricsServerAddOn,
            new ssp.ClusterAutoScalerAddOn,
            new ssp.ContainerInsightsAddOn,
        ];

        const gitUrl = 'https://github.com/aws-samples/ssp-eks-workloads.git'

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
                credentialsSecretName: 'github-ssh-key',
                credentialsType: 'SSH'
            },
        
        });

        const prodBootstrapArgo = new ArgoCDAddOn({
            bootstrapRepo: {
                repoUrl: 'git@github.com:aws-samples/ssp-eks-workloads.git',
                path: 'envs/prod',
                credentialsSecretName: 'github-ssh-key',
                credentialsType: 'SSH'
            },
            adminPasswordSecretName: 'argo-admin-secret',
        });

        const east1 = 'us-east-1';
        new ssp.EksBlueprint(scope, { id: `${id}-${east1}`, addOns: addOns.concat(devBootstrapArgo), teams }, {
            env: { region: east1 }
        });

        const east2 = 'us-east-2';
        new ssp.EksBlueprint(scope, { id: `${id}-${east2}`, addOns: addOns.concat(testBootstrapArgo), teams }, {
            env: { region: east2 }
        });

        const west2 = 'us-west-2'
        new ssp.EksBlueprint(scope, { id: `${id}-${west2}`, addOns: addOns.concat(prodBootstrapArgo), teams }, {
            env: { region: west2 }
        });
    }
}
