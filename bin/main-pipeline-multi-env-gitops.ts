#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import PipelineMultiEnvGitops from '../lib/pipeline-multi-env-gitops';

const app = new cdk.App();

const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION;
const env: cdk.Environment = { account: account, region: region };


let pipeline_account = app.node.tryGetContext('pipeline_account');
pipeline_account ??= account;
let pipeline_region = app.node.tryGetContext('pipeline_region');
pipeline_region ??= region;
const pipelineEnv: cdk.Environment = { account: pipeline_account, region: pipeline_region };
//
let dev_account = app.node.tryGetContext('pipeline_account');
dev_account ??= account;
let dev_region = app.node.tryGetContext('pipeline_region');
dev_region ??= region;
const devEnv: cdk.Environment = { account: dev_account, region: dev_region };
//
let prod_account = app.node.tryGetContext('pipeline_account');
prod_account ??= account;
let prod_region = app.node.tryGetContext('pipeline_region');
prod_region ??= region;
const prodEnv: cdk.Environment = { account: prod_account, region: prod_region };
//

new PipelineMultiEnvGitops()
    .buildAsync(app, 'pipeline-multi-env', { env },
        {
            devEnv: devEnv,
            pipelineEnv: pipelineEnv,
            prodEnv: prodEnv,
        })
    .catch(() => {
        console.log("Pipeline pattern is not setup due to missing secrets for GitHub access.");
    }

    );