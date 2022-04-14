import { Construct } from 'constructs';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import { KastenK10AddOn } from '@kastenhq/kasten-eks-blueprints-addon';

export default class KastenK10Construct {
    constructor(scope: Construct, id: string) {
        const stackId = `${id}-blueprint`;  

        blueprints.EksBlueprint.builder()
            .account(process.env.CDK_DEFAULT_ACCOUNT!)
            .region(process.env.CDK_DEFAULT_REGION)
            .addOns(new blueprints.ClusterAutoScalerAddOn, new KastenK10AddOn)
            .build(scope, stackId); 
    }
}
  