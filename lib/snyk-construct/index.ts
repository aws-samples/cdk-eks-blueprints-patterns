import * as blueprints from '@aws-quickstart/eks-blueprints';
import { SnykMonitorAddOn } from '@snyk-partners/snyk-monitor-eks-blueprints-addon';
import { Construct } from "constructs";

export default class SnykConstruct extends Construct {
    constructor(scope: Construct, id: string) {
        super(scope, id);

        const stackId = `${id}-blueprint`;

        const addOns: Array<blueprints.ClusterAddOn> = [
            new SnykMonitorAddOn({
                version: "1.87.2", // replace with the version you wish to deploy
                integrationId: "<your-integration-id>", // replace with your integration ID
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
