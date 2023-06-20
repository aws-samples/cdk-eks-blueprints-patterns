import { Construct } from 'constructs';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import { BatchEksTeam } from '@aws-quickstart/eks-blueprints';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';

export default class BatchOnEKSConstruct {
    build(scope: Construct, id: string, teams: BatchEksTeam[]) {
        
        const batchIamPolicy = new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
                "cloudwatch:PutMetricData",
                "ec2:DescribeVolumes",
                "ec2:DescribeTags",
                "logs:PutLogEvents",
                "logs:DescribeLogStreams",
                "logs:DescribeLogGroups",
                "logs:CreateLogStream",
                "logs:CreateLogGroup"
            ],
            resources: ["*"],
        });
        const stackID = `${id}-blueprint`;
        blueprints.EksBlueprint.builder()
            .account(process.env.CDK_DEFAULT_ACCOUNT!)
            .region(process.env.CDK_DEFAULT_REGION!)
            .addOns(
                new blueprints.AwsBatchAddOn(), 
                new blueprints.AwsForFluentBitAddOn({
                    iamPolicies:[batchIamPolicy],
                    values: {
                        cloudWatch: {
                            enabled: true,
                            region: process.env.CDK_DEFAULT_REGION!,
                            logGroupName: '/aws/batch/batch-team-a-logs'
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