import { EmrEksTeamProps } from "@aws-quickstart/eks-blueprints";
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';


export class EmrOnEksTeam {
    
    static executionRolePolicyStatement: PolicyStatement[] = [
        new PolicyStatement({
          actions:['logs:PutLogEvents','logs:CreateLogStream','logs:DescribeLogGroups','logs:DescribeLogStreams'], 
          resources:['arn:aws:logs:*:*:*'],
        }),
      ];
    
      public static readonly dataTeamA: EmrEksTeamProps = {
        name: 'emr-data-team-a',
        virtualClusterName: 'emr-data-team-a',
        virtualClusterNamespace: 'batchjob',
        createNamespace: true,
        executionRoles: [
          {
            executionRoleIamPolicyStatement: EmrOnEksTeam.executionRolePolicyStatement,
            executionRoleName: 'myBlueprintExecRole'
          }
        ]
      };
}