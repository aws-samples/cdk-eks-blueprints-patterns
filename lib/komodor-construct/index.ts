import * as blueprints from '@aws-quickstart/eks-blueprints';
import { KomodorAddOn } from '@komodor/komodor-eks-blueprints-addon';
import { Construct } from "constructs";

export default class KomodorConstruct extends Construct {
    constructor(scope: Construct, id: string) {
        super(scope, id);

        const stackId = `${id}-blueprint`;

        const addOns: Array<blueprints.ClusterAddOn> = [
            new KomodorAddOn({
                clusterName: stackId,
                apiKey: "<your-api-key>", //replace with your API key
                values: {} // add any custom Helm values
            })
        ];

        blueprints.EksBlueprint.builder()
            .account(process.env.CDK_DEFAULT_ACCOUNT!)
            .region(process.env.CDK_DEFAULT_REGION)
            .addOns(...addOns)
            .build(scope, stackId);
    }
}
