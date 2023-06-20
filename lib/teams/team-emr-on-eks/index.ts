import { EmrEksTeam } from '@aws-quickstart/eks-blueprints';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';


const executionRolePolicyStatement: PolicyStatement[] = [
    new PolicyStatement({
        actions: ['logs:PutLogEvents', 'logs:CreateLogStream', 'logs:DescribeLogGroups', 'logs:DescribeLogStreams'],
        resources: ['arn:aws:logs:*:*:*'],
    }),
];

export const dataTeam = new EmrEksTeam({
    name: 'emr-data-team-a',
    virtualClusterName: 'emr-data-team-a',
    virtualClusterNamespace: 'batchjob',
    createNamespace: true,
    executionRoles: [
        {
            executionRoleIamPolicyStatement: executionRolePolicyStatement,
            executionRoleName: 'myBlueprintExecRole'
        }
    ]
});
