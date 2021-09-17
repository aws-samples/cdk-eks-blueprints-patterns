#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';

const app = new cdk.App();

import NginxIngressConstruct from '../lib/nginx-ingress-construct';
new NginxIngressConstruct(app, 'nginx');


// //-------------------------------------------
// // Single Cluster with multiple teams.
// //-------------------------------------------

// import MultiTeamConstruct from '../lib/multi-team-construct';
// new MultiTeamConstruct(app, 'multi-team');


// //-------------------------------------------
// // Multiple clusters, multiple regions.
// //-------------------------------------------

// import MultiRegionConstruct from '../lib/multi-region-construct';
// new MultiRegionConstruct().buildAsync(app, 'multi-region').catch(() => {
//     console.log("Multi region pattern is not setup due to missing secrets for GitHub access and ArgoCD admin pwd.");
// });


// //-------------------------------------------
// // Single Fargate cluster.
// //-------------------------------------------

// import FargateConstruct from '../lib/fargate-construct';
// new FargateConstruct(app, 'fargate');


// //-------------------------------------------
// // Multiple clusters with deployment pipeline.
// //-------------------------------------------
// import PipelineConstruct from '../lib/pipeline-stack';
// const account = process.env.CDK_DEFAULT_ACCOUNT;
// const region = process.env.CDK_DEFAULT_REGION;
// const env = { account, region };
// if(account) {
//     new PipelineConstruct(app, 'pipeline', { env });
// }
// else {
//     console.log("Valid AWS credentials are required to synthesize pipeline stack. Please run 'aws configure'");
// }

// //-------------------------------------------
// // Single cluster with Bottlerocket nodes.
// //-------------------------------------------

// import BottleRocketConstruct from '../lib/bottlerocket-construct';
// new BottleRocketConstruct(app, 'bottlerocket');


// //-------------------------------------------
// // Single cluster with custom configuration.
// //-------------------------------------------

// import CustomClusterConstruct from '../lib/custom-cluster-construct';
// new CustomClusterConstruct(app, 'custom-cluster');

// import ScratchpadConstruct from '../lib/scratchpad';
// new ScratchpadConstruct(app, 'scratchpad');