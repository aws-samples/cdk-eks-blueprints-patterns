import { Construct } from 'constructs';
import * as blueprints from '@aws-quickstart/eks-blueprints';


import * as AWS from 'aws-sdk';

const s3 = new AWS.S3();

async function readSettingsFromS3(bucketName: string, key: string): Promise<string> {
    const params = {
        Bucket: bucketName,
        Key: key
    };

    try {
        const data = await s3.getObject(params).promise();
        return data.Body?.toString() || '';
    } catch (err) {
        console.error('Error reading settings file from S3:', err);
        throw err;
    }
}

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
            .version('auto')
            .build(scope, stackID);
    }
}


