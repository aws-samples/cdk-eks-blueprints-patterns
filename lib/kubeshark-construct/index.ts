import { Construct } from 'constructs';
import { EksBlueprint } from '@aws-quickstart/eks-blueprints';
import { KubesharkAddOn } from 'kubeshark';


export default class KubesharkConstruct {
    constructor(scope: Construct, id: string) {
        // AddOns for the cluster
        const stackId = `${id}-blueprint`;

        EksBlueprint.builder()
            .account(process.env.CDK_DEFAULT_ACCOUNT!)
            .region(process.env.CDK_DEFAULT_REGION)
            .addOns(new KubesharkAddOn())
            .version('auto')
            .build(scope, stackId);
    }
}
