import { Construct } from 'constructs';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import { KastenK10AddOn } from '@kastenhq/kasten-eks-blueprints-addon';


export default class KastenK10Construct {
    constructor(scope: Construct, id: string) {
        const stackId = `${id}-blueprint`;  

       const blueprint = blueprints.EksBlueprint.builder()
       .addOns(new blueprints.addons.ClusterAutoScalerAddOn)
       .addOns(new KastenK10AddOn);
    }
}
  