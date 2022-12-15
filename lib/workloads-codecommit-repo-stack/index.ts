import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';

export default class WorkloadsCodeCommitRepoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, repoName: string, userName: string, props?: cdk.StackProps) {
    super(scope, id, props);

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
    
    const lambdaCode = `
const https = require('https')

/* webhook payload
  {
    "ref": "refs/heads/master",
    "repository": {
      "html_url": "https://git-codecommit.us-west-2.amazonaws.com/v1/repos/eks-blueprints-workloads-cc",
      "default_branch": "master"
    }
  }
*/

exports.handler = async function(event) {
    const eventSourceARNarray = event.Records[0].eventSourceARN.split(':')
    const repoName = eventSourceARNarray[eventSourceARNarray.length - 1]
    const ref = event.Records[0].codecommit.references[0].ref
    const refArray = ref.split('/')
    const branch = refArray[refArray.length - 1];
    const data = JSON.stringify({
    "ref": ref,
    "repository": {
      "html_url": "https://git-codecommit." + event.Records[0].awsRegion + ".amazonaws.com/v1/repos/" + repoName,
      "default_branch": branch
    }
  });
  console.log(data)

  const options = {
    hostname: event.Records[0].customData,
    path: '/api/webhook',
    method: 'POST',
    port: 443,
    headers: {
      'Content-Type': 'application/json',
      'X-GitHub-Event': 'push',
      'Content-Length': data.length,
    },
  };

  const promise = new Promise(function(resolve, reject) {
    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
    const req = https.request(options, (res) => {
        resolve(res.statusCode)
      }).on('error', (e) => {
        reject(Error(e))
      })
      req.write(data);
      req.end();
    })
  return promise
}
    `;

    if (argoCDUrl.valueAsString.trim()) {
      const fn = new lambda.Function(this, repoName + '-webhook', {
        runtime: lambda.Runtime.NODEJS_16_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(lambdaCode),
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
