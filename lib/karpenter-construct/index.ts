import { EksBlueprint } from "@aws-quickstart/eks-blueprints";
import * as blueprints from "@aws-quickstart/eks-blueprints";
import { Construct } from "constructs"
export default class KarpenterConstruct {
    constructor(scope: Construct, id: string) {
        const account = process.env.CDK_DEFAULT_ACCOUNT!;
        const region = process.env.CDK_DEFAULT_REGION!;
        const stackID = `${id}-blueprint`;

        const addon = new blueprints.addons.KarpenterAddOn({
            requirements: [
                { key: 'node.kubernetes.io/instance-type', op: 'In', vals: ['m5.large'] },
                { key: 'topology.kubernetes.io/zone', op: 'NotIn', vals: ['us-west-2c']},
                { key: 'kubernetes.io/arch', op: 'In', vals: ['amd64','arm64']},
                { key: 'karpenter.sh/capacity-type', op: 'In', vals: ['spot','on-demand']},
            ],
            subnetTags: {
                "Name": "karpenter-blueprint/karpenter-blueprint-vpc/PrivateSubnet1",
            },
            securityGroupTags: {
                "kubernetes.io/cluster/karpenter-blueprint": "owned",
            },
            taints: [{
                key: "workload",
                value: "test",
                effect: "NoSchedule",
            }],
            amiFamily: "AL2",
            amiSelector: {
                "karpenter.sh/discovery/MyClusterName": '*',
            },
            consolidation: { enabled: true },
            ttlSecondsUntilExpired: 2592000,
            weight: 20,
            interruptionHandling: true,
        });


    EksBlueprint.builder()
            .account(account)
            .region(region)
            .addOns(addon)
            .build(scope, stackID);

}
}
