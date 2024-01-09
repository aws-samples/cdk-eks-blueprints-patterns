import { Construct } from 'constructs';
import { NestedStack, NestedStackProps, SecretValue } from 'aws-cdk-lib';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { CodeCommitCredentials } from './codecommit-credentials';

export default class WorkloadsCodeCommitRepoStack extends NestedStack {
    public static builder(userName: string, repoName: string): blueprints.NestedStackBuilder {
        return {
            build(scope: Construct, id: string, props: NestedStackProps) {
                return new WorkloadsCodeCommitRepoStack(scope, id, props, userName, repoName);
            }
        };
    }

    constructor(scope: Construct, id: string, props: NestedStackProps, userName: string, repoName: string) {
        super(scope, id);

        const repo = new codecommit.Repository(this, repoName + '-codecommit-repo', {
            repositoryName: repoName,
        });

        const user = new iam.User(this, userName + '-user-name', {
            userName: userName,
        });
        repo.grantPull(user);

        const credentials = new CodeCommitCredentials(this, "codecommit-credentials", user.userName);
        credentials.node.addDependency(user);

        new secretsmanager.Secret(this, 'codecommit-secret', {
            secretObjectValue: {
                username: SecretValue.unsafePlainText(credentials.serviceUserName),
                password: SecretValue.unsafePlainText(credentials.servicePassword),
                url: SecretValue.unsafePlainText(repo.repositoryCloneUrlHttp)
            },
            secretName: repoName + '-codecommit-secret'
        });

        const fn = new lambda.Function(this, repoName + '-webhook', {
            runtime: lambda.Runtime.NODEJS_20_X,
            functionName: repoName + '-webhook',
            description: 'Webhook for ArgoCD on commit to AWS CodeCommit',
            handler: 'index.handler',
            code: lambda.Code.fromAsset("lib/workloads-codecommit-construct/lambda"),
        });

        const principal = new iam.ServicePrincipal('codecommit.amazonaws.com');
        fn.grantInvoke(principal);
    }
}
