import { Construct } from 'constructs';

// Blueprints Lib
import * as blueprints from '@aws-quickstart/eks-blueprints'
import { ArgoCDAddOn, ClusterAutoScalerAddOn, MetricsServerAddOn } from '@aws-quickstart/eks-blueprints';


/**
 * Example starter with placeholders to add addOns and teams.
 */
export default class StarterConstruct {
    build(scope: Construct, id: string) {
        
        const stackID = `${id}-blueprint`
        blueprints.EksBlueprint.builder()
            .account(process.env.CDK_DEFAULT_ACCOUNT!)
            .region(process.env.CDK_DEFAULT_REGION!)
            .addOns( new MetricsServerAddOn,
                new ClusterAutoScalerAddOn,
                new ArgoCDAddOn // add other addons here
            )
            .teams()// add teams here)
            .build(scope, stackID);
    }
}


