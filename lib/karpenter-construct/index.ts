import { EksBlueprint } from "@aws-quickstart/eks-blueprints";
import * as blueprints from "@aws-quickstart/eks-blueprints";
import { Construct } from "constructs";
export default class KarpenterConstruct {
    constructor(scope: Construct, id: string) {
        const account = process.env.CDK_DEFAULT_ACCOUNT!;
        const region = process.env.CDK_DEFAULT_REGION!;
        const stackID = `${id}-blueprint`;

        const karpenterAddOn = new blueprints.addons.KarpenterAddOn({
            version: 'v0.33.1',
            nodePoolSpec: {
                requirements: [
                    { key: 'node.kubernetes.io/instance-type', operator: 'In', values: ['m5.large'] },
                    { key: 'topology.kubernetes.io/zone', operator: 'In', values: [`${region}a`,`${region}b`, `${region}c`]},
                    { key: 'kubernetes.io/arch', operator: 'In', values: ['amd64','arm64']},
                    { key: 'karpenter.sh/capacity-type', operator: 'In', values: ['on-demand']},
                ],
                disruption: {
                    consolidationPolicy: "WhenUnderutilized",
                    expireAfter: "259200s"
                },
                weight: 20,

            },
            ec2NodeClassSpec:{
                subnetSelectorTerms: [
                    {
                        tags: { "Name": `${stackID}/${stackID}-vpc/*` }
                    }
                ],
                securityGroupSelectorTerms: [
                    {
                        tags: { [`kubernetes.io/cluster/${stackID}`]: "owned" }
                    }
                ],

                amiFamily: "AL2"
            },
            interruptionHandling: true,
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
                karpenterAddOn,
            )
            .build(scope, stackID);

    }
}
