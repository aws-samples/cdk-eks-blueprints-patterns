import { 
    EksBlueprint, 
    AwsLoadBalancerControllerAddOn, 
    CertManagerAddOn, 
    ClusterAutoScalerAddOn, 
    CoreDnsAddOn, 
    EbsCsiDriverAddOn, 
    EmrEksAddOn, 
    EmrEksTeam, 
    KubeProxyAddOn, 
    MetricsServerAddOn, 
    VpcCniAddOn 
} from '@aws-quickstart/eks-blueprints';

import * as cdk from 'aws-cdk-lib';

export default class EmrEksConstruct {

    build(scope: cdk.App, id: string, teams: EmrEksTeam[]) {
        
        const stackId = `${id}-blueprint`;

        EksBlueprint.builder().addOns(
            new AwsLoadBalancerControllerAddOn,
            new VpcCniAddOn(),
            new CoreDnsAddOn(),
            new MetricsServerAddOn,
            new ClusterAutoScalerAddOn,
            new CertManagerAddOn,
            new EbsCsiDriverAddOn,
            new KubeProxyAddOn,
            new EmrEksAddOn
        ).teams(
            ...teams
        ).build(scope, stackId);
    }

}