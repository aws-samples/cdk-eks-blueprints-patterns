import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';

export default class WorkloadsCodeCommitRepoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, repoName: string, userName: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const account = props?.env?.account!;
    const region = props?.env?.region!;

    const argoCDUrl = new cdk.CfnParameter(this, 'argoCDUrl', {
      type: 'String',
      description: 'The URL of ArgoCD server',
      default: '',
    });

    const repo = new codecommit.Repository(this, 'codecommit-repo', {
      repositoryName: repoName,
    });

    const user = new iam.User(this, 'argocd-user-name', {
      userName: userName,
    });
    repo.grantPull(user);

    if (!!argoCDUrl.valueAsString.trim) {
      const fn = new lambda.Function(this, repoName + '-webhook', {
        runtime: lambda.Runtime.NODEJS_16_X,
        handler: 'workloads-codecommit-webhook.handler',
        code: lambda.Code.fromAsset("lib/workloads-codecommit-repo-stack"),

      });

      const principal = new iam.ServicePrincipal('codecommit.amazonaws.com');
      fn.grantInvoke(principal);

      console.log('argoCDUrl = ' + argoCDUrl.valueAsString);
      repo.notify(fn.functionArn, {
        events: [codecommit.RepositoryEventTrigger.ALL],
        name: repoName + '-trigger',
        customData: argoCDUrl.valueAsString,
        branches: [],
      })
    }
    
    new cdk.CfnOutput(this, repoName + '-url', {
      value: repo.repositoryCloneUrlHttp,
      description: 'The Clone url of the AWS CodeCommit workloads repository',
      exportName: repoName + '-url',
    });
  }
}
