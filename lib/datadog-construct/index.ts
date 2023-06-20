import { Construct } from 'constructs';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import { DatadogAddOn } from '@datadog/datadog-eks-blueprints-addon';
import { prevalidateSecrets } from '../common/construct-utils';

const SECRET_API_KEY = 'datadog-api-key';

export default class DatadogConstruct {
    
    async buildAsync(scope: Construct, id: string) {

        await prevalidateSecrets(DatadogConstruct.name, process.env.CDK_DEFAULT_REGION!, SECRET_API_KEY);

        const stackID = `${id}-blueprint`;

        const addOns: Array<blueprints.ClusterAddOn> = [
            new DatadogAddOn({
                apiKeyAWSSecret: SECRET_API_KEY
            })
        ];

        blueprints.EksBlueprint.builder()
            .account(process.env.CDK_DEFAULT_ACCOUNT!)
            .region(process.env.CDK_DEFAULT_REGION!)
            .addOns(...addOns)
            .build(scope, stackID);
    }
}
