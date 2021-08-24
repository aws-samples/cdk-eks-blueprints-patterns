#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';

const app = new cdk.App();

//-------------------------------------------
// Single Cluster with multiple teams.
//-------------------------------------------

import MultiTeamConstruct from '../lib/multi-team-construct'
new MultiTeamConstruct(app, 'multi-team');


//-------------------------------------------
// Multiple clusters, multiple regions.
//-------------------------------------------

import MultiRegionConstruct from '../lib/multi-region-construct'
new MultiRegionConstruct().buildAsync(app, 'multi-region').catch(() => {
    console.log("Multi region pattern is not setup due to missing secrets for GitHub access and ArgoCD admin pwd.");
});


//-------------------------------------------
// Single Fargate cluster.
//-------------------------------------------

import FargateConstruct from '../lib/fargate-construct'
new FargateConstruct(app, 'fargate');


//-------------------------------------------
// Multiple clusters with deployment pipeline.
//-------------------------------------------
import PipelineConstruct from '../lib/pipeline-stack';
const account = process.env.CDK_DEFAULT_ACCOUNT ?? '123456789012';
const region = process.env.CDK_DEFAULT_REGION ?? 'us-west-2';
const env = { account, region };
new PipelineConstruct(app, 'pipeline', { env });


//-------------------------------------------
// Single cluster with Bottlerocket nodes.
//-------------------------------------------

import BottleRocketConstruct from '../lib/bottlerocket-construct'
new BottleRocketConstruct(app, 'bottlerocket');


//-------------------------------------------
// Single cluster with custom configuration.
//-------------------------------------------

import CustomClusterConstruct from '../lib/custom-cluster-construct'
new CustomClusterConstruct(app, 'custom-cluster');

import ScratchpadConstruct from '../lib/scratchpad'
new ScratchpadConstruct(app, 'scratchpad');


