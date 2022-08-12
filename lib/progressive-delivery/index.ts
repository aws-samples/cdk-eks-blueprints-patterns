import { Construct } from 'constructs';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import { MeshProviderOptions } from '@aws-quickstart/eks-blueprints';
import * as team from '../teams';

export const SECRET_ARGO_ADMIN_PWD = 'argo-admin-secret';

/**
 * Demonstrates how to use Flagger for progressive delivery utilizing nginx mesh provider.
 */
export default class ProgressiveDemoConstruct {

    build(scope: Construct, id: string) {

        const dataManifestDir = './lib/teams/team-data/'

        const stackID = `${id}-blueprint`;
        const accountID = process.env.CDK_DEFAULT_ACCOUNT!;

        const workload = 'https://github.com/Eli1123/eks-blueprints-workloads.git' 

        blueprints.EksBlueprint.builder()
            .account(accountID)
            .region('us-east-2')
            .addOns(
                new blueprints.ArgoCDAddOn({
                    bootstrapRepo: {
                        repoUrl: workload,
                        path: 'teams/team-data/dev'
                    },
                    adminPasswordSecretName: SECRET_ARGO_ADMIN_PWD,
                    
                }),
                new blueprints.addons.SecretsStoreAddOn(),
                new blueprints.addons.FlaggerAddOn({meshProvider: MeshProviderOptions.NGINX}),
                new blueprints.addons.AwsLoadBalancerControllerAddOn(),
                new blueprints.addons.NginxAddOn({values:
                    {
                        controller: {
                            enableLatencyMetrics: "true"
                        },
                        prometheus: {
                            create: "true"
                        },
                }}),
                )
            .teams(new team.TeamDataSetup(scope, dataManifestDir))
            .build(scope, stackID);
    }
}

//option in flagger to also do flagger load tester look into