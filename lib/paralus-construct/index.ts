import { Construct } from 'constructs';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import { ParalusAddOn } from '@paralus/paralus-eks-blueprints-addon';

export default class ParalusConstruct {
    constructor(scope: Construct, id: string) {
        // AddOns for the cluster
        const stackId = `${id}-blueprint`;
        blueprints.EksBlueprint.builder()
            .account(process.env.CDK_DEFAULT_ACCOUNT!)
            .region(process.env.CDK_DEFAULT_REGION)
            .addOns( 
                new blueprints.AwsLoadBalancerControllerAddOn(),
                new blueprints.VpcCniAddOn(),
                new blueprints.KubeProxyAddOn(),
                new blueprints.EbsCsiDriverAddOn(),
                new blueprints.CertManagerAddOn(),
                new ParalusAddOn({
                    namespace: 'paralus-system',
                    // this signifies the paralus version to be deployed
                    version: '0.2.3',
                    // this flag deploys kratos in dev mode, install postgres, by default it is true
                    development: true,
                    /**
                    * Values to pass to the chart as per https://github.com/paralus/helm-charts/blob/main/charts/ztka/values.yaml.
                    */
                    // update this to your domain, as paralus works based on domain based routing
                    values: {
                        "fqdn": {
                            "domain": "your-own-domain-name",
                            "hostname": "console-eks",
                            "coreConnectorSubdomain": "*.core-connector.eks",
                            "userSubdomain": "*.user.eks"
                        }
                    }
                })
            )
            .teams()// add teams here)
            .build(scope, stackId);
    }
}
