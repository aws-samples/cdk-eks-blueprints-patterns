import { Construct } from 'constructs';
// Blueprints Lib
import * as blueprints from '@aws-quickstart/eks-blueprints';

// Team implementations
import * as team from '../teams';
const burnhamManifestDir = './lib/teams/team-burnham/';
const rikerManifestDir = './lib/teams/team-riker/';
const teamManifestDirList = [burnhamManifestDir,rikerManifestDir];

export default class MultiTeamConstruct {
    constructor(scope: Construct, id: string) {
        
        // Setup platform team
        const accountID = process.env.CDK_DEFAULT_ACCOUNT!;
        const platformTeam = new team.TeamPlatform(accountID);

        // Teams for the cluster.
        const teams: Array<blueprints.Team> = [
            platformTeam,
            new team.TeamTroiSetup,
            new team.TeamRikerSetup(scope, teamManifestDirList[1]),
            new team.TeamBurnhamSetup(scope, teamManifestDirList[0])
        ];

        // AddOns for the cluster.
        const addOns: Array<blueprints.ClusterAddOn> = [
            new blueprints.AwsLoadBalancerControllerAddOn,
            new blueprints.CertManagerAddOn,
            new blueprints.AdotCollectorAddOn,
            new blueprints.AppMeshAddOn,
            new blueprints.NginxAddOn,
            new blueprints.ArgoCDAddOn,
            new blueprints.CalicoOperatorAddOn,
            new blueprints.MetricsServerAddOn,
            new blueprints.ClusterAutoScalerAddOn,
            new blueprints.CloudWatchAdotAddOn,
            new blueprints.XrayAddOn,
            new blueprints.SecretsStoreAddOn
        ];

        const stackID = `${id}-blueprint`;
        new blueprints.EksBlueprint(scope, { id: stackID, addOns, teams }, {
            env: {
                region: 'us-east-2',
            },
        });
    }
}


