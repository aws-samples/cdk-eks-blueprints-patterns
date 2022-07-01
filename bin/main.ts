#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';

const app = new cdk.App();

// CDK Default Environment - default account and region
const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION;
const env: cdk.Environment = { account: account, region: region };

import NginxIngressConstruct from '../lib/nginx-ingress-construct';
new NginxIngressConstruct().buildAsync(app, 'nginx').catch(() => {
    console.log("NGINX Ingress pattern is not setup due to missing secrets for ArgoCD admin pwd.");
});
//-------------------------------------------
// Starter Cluster with barebone infrastructure.
//-------------------------------------------

import StarterConstruct from '../lib/starter-construct';
new StarterConstruct().build(app, 'starter');


//-------------------------------------------
// Single Cluster with multiple teams.
//-------------------------------------------

import MultiTeamConstruct from '../lib/multi-team-construct';
new MultiTeamConstruct(app, 'multi-team');


//-------------------------------------------
// Multiple clusters, multiple regions.
//-------------------------------------------

import MultiRegionConstruct from '../lib/multi-region-construct';
new MultiRegionConstruct().buildAsync(app, 'multi-region').catch((error) => {
    console.log("Multi region pattern is not setup due to missing secrets: " + error);
});

//--------------------------------------------------------------------------
// Multiple clusters, multiple reginos ,multiple teams, GitOps bootstrapped.
//--------------------------------------------------------------------------

import PipelineMultiEnvGitops from '../lib/pipeline-multi-env-gitops';

// These different CDK environments are meant to use for multi-account/environment usage, 
// where the pipeline, dev cluster, and prod cluster are deployed in seperate environment
const { devEnv, pipelineEnv, prodEnv }: { devEnv: cdk.Environment; pipelineEnv: cdk.Environment; prodEnv: cdk.Environment; } = populateContextDefaults();

new PipelineMultiEnvGitops()
    .buildAsync(app, 'pipeline-multi-env',
        {
            devEnv: devEnv,
            pipelineEnv: pipelineEnv,
            prodEnv: prodEnv,
        },
        { env })
    .catch(() => {
        console.log("Pipeline pattern is not setup due to missing secrets for GitHub access.");
    });

function populateContextDefaults() {
    // Populate Context Defaults for the pipeline account
    let pipeline_account = app.node.tryGetContext('pipeline_account');
    pipeline_account ??= account;
    let pipeline_region = app.node.tryGetContext('pipeline_region');
    pipeline_region ??= region;
    const pipelineEnv: cdk.Environment = { account: pipeline_account, region: pipeline_region };

    // Populate Context Defaults for the Development account
    let dev_account = app.node.tryGetContext('dev_account');
    dev_account ??= account;
    let dev_region = app.node.tryGetContext('dev_region');
    dev_region ??= region;
    const devEnv: cdk.Environment = { account: dev_account, region: dev_region };

    // Populate Context Defaults for the Production  account
    let prod_account = app.node.tryGetContext('prod_account');
    prod_account ??= account;
    let prod_region = app.node.tryGetContext('prod_region');
    prod_region ??= region;
    const prodEnv: cdk.Environment = { account: prod_account, region: prod_region };
    return { devEnv, pipelineEnv, prodEnv };
}


//-------------------------------------------
// Single Fargate cluster.
//-------------------------------------------

import FargateConstruct from '../lib/fargate-construct';
new FargateConstruct(app, 'fargate');


//-------------------------------------------
// Multiple clusters with deployment pipeline.
//-------------------------------------------
import PipelineConstruct from '../lib/pipeline-stack';

if (account) {
    new PipelineConstruct().buildAsync(app, { env }).catch(() => {
        console.log("Pipeline pattern is not setup due to missing secrets for GitHub access.");
    });
}
else {
    console.log("Valid AWS credentials are required to synthesize pipeline stack. Please run 'aws configure'");
}

//-------------------------------------------
// Single cluster with Bottlerocket nodes.
//-------------------------------------------

import BottleRocketConstruct from '../lib/bottlerocket-construct';
new BottleRocketConstruct().build(app, 'bottlerocket');


//-------------------------------------------
// Single cluster with custom configuration.
//-------------------------------------------

import GenericClusterConstruct from '../lib/generic-cluster-construct';
new GenericClusterConstruct().build(app, 'generic-cluster');

import DynatraceOperatorConstruct from '../lib/dynatrace-construct';
new DynatraceOperatorConstruct().buildAsync(app, "dynatrace-operator").catch(() => {
    console.log("Dynatrace pattern is not setup due to missing secrets for dynatrace-tokens.");
});

import KubecostConstruct from '../lib/kubecost-construct';
new KubecostConstruct(app, 'kubecost');

import KeptnControlPlaneConstruct from '../lib/keptn-construct';
new KeptnControlPlaneConstruct(app, 'keptn');

import NewRelicConstruct from '../lib/newrelic-construct';
new NewRelicConstruct(app, 'newrelic-cluster');

import DatadogConstruct from '../lib/datadog-construct';

new DatadogConstruct().buildAsync(app, 'datadog').catch((error) => {
    console.log("Datadog pattern is not setup due to missing secrets: " + error);
});

import KastenK10Construct from '../lib/kasten-k10-construct';
new KastenK10Construct(app, 'kasten');

import SnykConstruct from '../lib/snyk-construct';
new SnykConstruct(app, 'snyk-monitor');

import RafayConstruct from '../lib/rafay-construct';
new RafayConstruct().buildAsync(app, 'rafay-cluster').catch((error) => {
    console.log("Rafay pattern is not setup due to missing secrets: " + error);
});