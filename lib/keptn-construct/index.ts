import { Construct } from 'constructs';
import { EksBlueprint } from '@aws-quickstart/eks-blueprints';
import { KeptnControlPlaneAddOn } from '@keptn/keptn-controlplane-eks-blueprints-addon';

export default class KeptnControlPlaneConstruct {

    constructor(scope: Construct, id: string) {
        // AddOns for the cluster
        const stackId = `${id}-blueprint`;

        const keptnControlPlane = new KeptnControlPlaneAddOn({
            // uncomment after you setup the ssm secret keptn-secrets.
            // ssmSecretName: 'keptn-secrets'
        });

        EksBlueprint.builder()
            .account(process.env.CDK_DEFAULT_ACCOUNT!)
            .region(process.env.CDK_DEFAULT_REGION)
            .addOns(keptnControlPlane)
            .build(scope, stackId);
    }
}
