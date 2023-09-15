import { EksBlueprint } from "@aws-quickstart/eks-blueprints";
import * as blueprints from "@aws-quickstart/eks-blueprints";
import * as spi from '@aws-quickstart/eks-blueprints/dist/spi';
import * as utils from "@aws-quickstart/eks-blueprints/dist/utils";
import { Construct } from "constructs";
import { NestedStack, NestedStackProps } from 'aws-cdk-lib';
import { BedrockShowcaseAddon, BedrockShowcaseAddonProps } from "./bedrock-showcase-addon";
export default class GenAIShowcase {
    constructor(scope: Construct, id: string) {
        const account = process.env.CDK_DEFAULT_ACCOUNT!;
        const region = process.env.CDK_DEFAULT_REGION!;
        const stackID = `${id}-blueprint`;

        const bedrockShowcaseAddonProps = {
            name: blueprints.utils.valueFromContext(scope, "bedrock.pattern.name", "showcase"),
            namespace: blueprints.utils.valueFromContext(scope, "bedrock.pattern.namespace", "bedrock"),
            imageName: blueprints.utils.valueFromContext(scope,"bedrock.pattern.image.name", undefined),
            imageTag: blueprints.utils.valueFromContext(scope, "bedrock.pattern.image.tag", undefined),

        } as BedrockShowcaseAddonProps;

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
                new blueprints.addons.NestedStackAddOn({
                    id: "usage-tracking-addon",
                    builder: UsageTrackingAddOn.builder(),
                }),
                new blueprints.addons.SSMAgentAddOn(),
                new blueprints.addons.MetricsServerAddOn(),
                new BedrockShowcaseAddon(bedrockShowcaseAddonProps)
            )
            .build(scope, stackID);

    }
}

/**
 * Nested stack that is used as tracker for GPU Accelerator
 */
class UsageTrackingAddOn extends NestedStack {

    static readonly USAGE_ID = "qs-1uijcfop9";

    public static builder(): spi.NestedStackBuilder {
        return {
            build(scope: Construct, id: string, props: NestedStackProps) {
                return new UsageTrackingAddOn(scope, id, props);
            }
        };
    }

    constructor(scope: Construct, id: string, props: NestedStackProps) {
        super(scope, id, utils.withUsageTracking(UsageTrackingAddOn.USAGE_ID, props));
    }
}
