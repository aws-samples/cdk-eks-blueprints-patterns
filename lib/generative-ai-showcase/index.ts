import { EksBlueprint } from "@aws-quickstart/eks-blueprints";
import * as blueprints from "@aws-quickstart/eks-blueprints";
import { Construct } from "constructs";
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
                new blueprints.addons.SSMAgentAddOn(),
                new blueprints.addons.MetricsServerAddOn(),
                new BedrockShowcaseAddon(bedrockShowcaseAddonProps)
            )
            .build(scope, stackID);

    }
}
