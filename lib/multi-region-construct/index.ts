import * as cdk from '@aws-cdk/core';

// SSP Lib
import * as ssp from '@shapirov/cdk-eks-blueprint'
import { ArgoCDAddOn } from '@shapirov/cdk-eks-blueprint';

// Team implementations
import * as team from '../teams'

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
                credentialsSecretName: 'github-ssp-ssh',
                credentialsType: 'SSH'
            }
        });
        const prodBootstrapArgo = new ArgoCDAddOn({
            bootstrapRepo: {
                repoUrl: 'git@github.com:aws-samples/ssp-eks-workloads.git',
                path: 'envs/prod',
                credentialsSecretName: 'github-ssp-ssh',
                credentialsType: 'SSH'
            }
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
