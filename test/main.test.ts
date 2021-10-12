import '@aws-cdk/assert/jest';
import * as cdk from '@aws-cdk/core';
import { SynthUtils } from '@aws-cdk/assert';
import NginxIngressConstruct from '../lib/nginx-ingress-construct';


export class NginxIngress extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string) {
    super(scope, id);

    new NginxIngressConstruct(this, 'nginx')
  }
}

test('Test', () => {
  // GIVEN
  const app = new cdk.App();
  const env = {
    region: app.node.tryGetContext('region') || process.env.CDK_DEFAULT_REGION || 'eu-west-1',
    account: app.node.tryGetContext('account') || process.env.CDK_DEFAULT_ACCOUNT || 'xxxxxxxxxxxx',
  };


  // WHEN
  const stack = new NginxIngress(app, 'nginx');
  //const stack = new MyStack(app, 'test');

  // THEN
    //Finally Check Snapshot
  expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot();

  // expect(stack).not.toHaveResource('AWS::S3::Bucket');
  // expect(app.synth().getStackArtifact(stack.artifactId).template).toMatchSnapshot();

  expect(stack).toHaveResource('AWS::EC2::VPC', {
    EnableDnsSupport: true,
    CidrBlock: '10.0.0.0/16',
    Tags: [
      {
        Key: 'Name',
        Value: 'Casskop/Vpc',
      },
    ],
  });

}