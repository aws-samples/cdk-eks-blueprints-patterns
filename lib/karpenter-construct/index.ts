import { EksBlueprint } from "@aws-quickstart/eks-blueprints";
import * as blueprints from "@aws-quickstart/eks-blueprints";
import { Construct } from "constructs";
export default class KarpenterConstruct {
    constructor(scope: Construct, id: string) {
        const account = process.env.CDK_DEFAULT_ACCOUNT!;
        const region = process.env.CDK_DEFAULT_REGION!;
        const stackID = `${id}-blueprint`;

        const karpenterAddon = new blueprints.addons.KarpenterAddOn({
            // requirements: [
            //     { key: 'node.kubernetes.io/instance-type', op: 'In', vals: ['m5.large'] },
            //     { key: 'topology.kubernetes.io/zone', op: 'NotIn', vals: ['us-west-2c']},
            //     { key: 'kubernetes.io/arch', op: 'In', vals: ['amd64','arm64']},
            //     { key: 'karpenter.sh/capacity-type', op: 'In', vals: ['on-demand']},
            // ],
            // subnetTags: {
            //     "Name": `${stackID}/${stackID}-vpc/*`,
            // },
            // securityGroupTags: {
            //     [`kubernetes.io/cluster/${stackID}`]: "owned",
            // },
            // consolidation: { enabled: true },
            // ttlSecondsUntilExpired: 2592000,
            // weight: 20,
            // interruptionHandling: true,
        });


        EksBlueprint.builder()
            .account(account)
            .region(region)
            .version('auto')
            .addOns(
                new blueprints.addons.AwsLoadBalancerControllerAddOn(),
                new blueprints.addons.VpcCniAddOn(),
                new blueprints.addons.CoreDnsAddOn(),
                new blueprints.addons.KubeProxyAddOn(),
                new blueprints.addons.CertManagerAddOn(),
                new blueprints.addons.KubeStateMetricsAddOn(),
                new blueprints.addons.SSMAgentAddOn(),
                new blueprints.addons.MetricsServerAddOn(),
                karpenterAddon,
            )
            .build(scope, stackID);

    }
}
