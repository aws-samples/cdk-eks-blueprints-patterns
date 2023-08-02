import { Construct } from 'constructs';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import * as team from '../teams';
import { GitlabRunnerHelmAddon } from './gitlabrunnerhelmaddon';
import { utils } from '@aws-quickstart/eks-blueprints';

/**

 */
export default class GitlabRunnerConstruct {
    constructor(scope: Construct, id: string) {
        // Setup platform team
        const accountID = process.env.CDK_DEFAULT_ACCOUNT!;
        const platformTeam = new team.TeamPlatform(accountID);
        const gitlabToken: string = utils.valueFromContext(scope, "gitlab.token", undefined);
       
        const fargateProfiles: Map<string, eks.FargateProfileOptions> = new Map([
            ["team1", { selectors: [{ namespace: "gitlab-runner" }] }]
        ]);

        const stackID = `${id}-blueprint`;
        const clusterProvider = new blueprints.FargateClusterProvider({
            fargateProfiles,
            version: eks.KubernetesVersion.V1_26
        });

        const addOns: Array<blueprints.ClusterAddOn> = [
            new blueprints.addons.AwsLoadBalancerControllerAddOn(),
            new blueprints.addons.VpcCniAddOn(),
            new blueprints.addons.CoreDnsAddOn(),
            new blueprints.addons.KubeProxyAddOn(),
            new blueprints.addons.CertManagerAddOn(),
            new blueprints.addons.MetricsServerAddOn(),
            new blueprints.addons.KarpenterAddOn({
                requirements: [
                    { key: 'node.kubernetes.io/instance-type', op: 'In', vals: ['m5.large'] },
                    { key: 'topology.kubernetes.io/zone', op: 'NotIn', vals: ['us-west-2c']},
                    { key: 'kubernetes.io/arch', op: 'In', vals: ['amd64','arm64']},
                    { key: 'karpenter.sh/capacity-type', op: 'In', vals: ['on-demand']},
                ],
                subnetTags: {
                    "Name": `${stackID}/${stackID}-vpc/*`,
                },
                securityGroupTags: {
                    [`kubernetes.io/cluster/${stackID}`]: "owned",
                },
                consolidation: { enabled: true },
                ttlSecondsUntilExpired: 2592000,
                weight: 20,
                interruptionHandling: true,
            }),
            new GitlabRunnerHelmAddon({
                values: {
                    runnerRegistrationToken: gitlabToken,
                }
            }),
        ];

        blueprints.EksBlueprint.builder()
            .account(accountID)
            .clusterProvider(clusterProvider)
            .teams(platformTeam)
            .addOns(...addOns)
            .build(scope, stackID);
    }
}



