import '@aws-cdk/assert/jest';
import * as cdk from '@aws-cdk/core';
import { SynthUtils } from '@aws-cdk/assert';
import MultiRegionConstruct from '../lib/multi-region-construct';


export class MultiRegion extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string) {
    super(scope, id);

   
new MultiRegionConstruct().buildAsync(app, 'multi-region').catch(() => {
    console.log("Multi region pattern is not setup due to missing secrets for GitHub access and ArgoCD admin pwd.");
});
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
  const stack = new MultiRegion(app, 'multi-region');
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