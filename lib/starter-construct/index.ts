import { Construct } from 'constructs';
import * as blueprints from '@aws-quickstart/eks-blueprints';



/**
 * Example starter with placeholders to add addOns and teams.
 */
export default class StarterConstruct {
    build(scope: Construct, id: string) {
        
        const stackID = `${id}-blueprint`;
        blueprints.EksBlueprint.builder()
            .addOns(
                new blueprints.AwsLoadBalancerControllerAddOn,
                new blueprints.VpcCniAddOn(), 
                new blueprints.MetricsServerAddOn,
                new blueprints.ClusterAutoScalerAddOn,
            )
            .teams()
            .build(scope, stackID);
    }
}


