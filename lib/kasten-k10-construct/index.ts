import { App } from 'aws-cdk-lib';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import { KastenK10AddOn } from '@kastenhq/kasten-eks-blueprints-addon';

const app = new App();

blueprints.EksBlueprint.builder()
    .addOns(new blueprints.ClusterAutoScalerAddOn)
    .addOns(new KastenK10AddOn)
    .build(app, 'eks-with-kastenk10');