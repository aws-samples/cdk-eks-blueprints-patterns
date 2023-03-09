import { Construct } from 'constructs';
import * as blueprints from '@aws-quickstart/eks-blueprints'
import { BatchEksTeam } from '@aws-quickstart/eks-blueprints';

export default class BatchOnEKSConstruct {
    build(scope: Construct, id: string, teams: BatchEksTeam[]) {
        
        const stackID = `${id}-blueprint`
        blueprints.EksBlueprint.builder()
            .account(process.env.CDK_DEFAULT_ACCOUNT!)
            .region(process.env.CDK_DEFAULT_REGION!)
            .addOns(
                new blueprints.AwsBatchAddOn(), 
                new blueprints.AwsForFluentBitAddOn({
                    version: '0.1.23',
                    values: {
                        cloudWatch: {
                            enabled: true,
                            region: process.env.CDK_DEFAULT_REGION!,
                            logGroupName: 'aws-batch-for-eks-logs'
                        },
                        tolerations: [{
                            "key": "batch.amazonaws.com/batch-node", "operator": "Exists"
                        }]
                    }
                })
            )
            .teams(...teams)
            .build(scope, stackID);
    }
}