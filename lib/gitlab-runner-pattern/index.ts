import { Construct } from 'constructs';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import * as team from '../teams';
import { CpuArch, GitlabRunnerHelmAddon } from './gitlabrunnerhelmaddon';
import { utils } from '@aws-quickstart/eks-blueprints';
import { GitlabRunnerSecretAddon } from './gitlabrunnersecretaddon';

/**

 */
export default class GitlabRunnerConstruct {
    constructor(scope: Construct, id: string) {
        // Setup platform team
        const accountID = process.env.CDK_DEFAULT_ACCOUNT!;
        const platformTeam = new team.TeamPlatform(accountID);
       
        const fargateProfiles: Map<string, eks.FargateProfileOptions> = new Map([
            ["team1", { selectors: [{ namespace: "gitlab-runner" }, { namespace: "karpenter" }] }]
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
            new blueprints.addons.MetricsServerAddOn(),
            new blueprints.addons.ExternalsSecretsAddOn(),
            new blueprints.addons.KarpenterAddOn({
                requirements: [
                    { key: 'node.kubernetes.io/instance-type', op: 'In', vals: ['m5.large'] },
                    { key: 'topology.kubernetes.io/zone', op: 'NotIn', vals: [`${process.env.CDK_DEFAULT_REGION}c`]},
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
                    arch: CpuArch.X86_64,
                    secretName: "gitlab-runner"
            }),
            new GitlabRunnerSecretAddon()
        ];

        blueprints.EksBlueprint.builder()
            .account(accountID)
            .clusterProvider(clusterProvider)
            .teams(platformTeam)
            .addOns(...addOns)
            .build(scope, stackID);
    }
}



