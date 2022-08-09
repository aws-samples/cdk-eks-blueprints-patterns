#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { logger } from '@aws-quickstart/eks-blueprints/dist/utils';

const app = new cdk.App();

// CDK Default Environment - default account and region
const account = process.env.CDK_DEFAULT_ACCOUNT!;
const region = process.env.CDK_DEFAULT_REGION!;
const env: cdk.Environment = { account: account, region: region };


import NginxIngressConstruct from '../lib/nginx-ingress-construct';
new NginxIngressConstruct().buildAsync(app, 'nginx').catch(() => {
    logger.info("NGINX Ingress pattern is not setup due to missing secrets for ArgoCD admin pwd.");
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
    logger.info("Multi region pattern is not setup due to missing secrets: ", error);
});

//--------------------------------------------------------------------------
// Multiple clusters, multiple reginos ,multiple teams, GitOps bootstrapped.
//--------------------------------------------------------------------------

import PipelineMultiEnvGitops, { populateWithContextDefaults } from '../lib/pipeline-multi-env-gitops';

// These different CDK environments are meant to be used for multi-region/account usage, 
// where the pipeline, dev cluster, and prod cluster are deployed in seperate environments
const { devEnv, pipelineEnv, prodEnv }:
    { devEnv: cdk.Environment; pipelineEnv: cdk.Environment; prodEnv: cdk.Environment; } =
    populateWithContextDefaults(app, account, region);

new PipelineMultiEnvGitops()
    .buildAsync(app, 'pipeline-multi-env',
        {
            devEnv: devEnv,
            pipelineEnv: pipelineEnv,
            prodEnv: prodEnv,
        },
        { env })
    .catch(() => {
        logger.info("Pipeline pattern is not setup due to missing secrets for GitHub access.");
    });

//--------------------------------------------------------------------------
// Multiple clusters, multiple accounts, pipeline and Monitoring
//--------------------------------------------------------------------------

import PipelineMultiEnvMonitoring, { populateAccountWithContextDefaults } from '../lib/multi-account-amp-monitoring';

// These different CDK environments are meant to be used for multi-region/account usage, 
// where the pipeline, dev cluster, and prod cluster are deployed in seperate environments
const { prodEnv1, prodEnv2, pipelineMonEnv, monitoringEnv }:
    { prodEnv1: cdk.Environment; prodEnv2: cdk.Environment; pipelineMonEnv: cdk.Environment; monitoringEnv: cdk.Environment; } =
    populateAccountWithContextDefaults(app, account, region);

new PipelineMultiEnvMonitoring()
    .buildAsync(app, 'pipeline-multi-env-monitoring',
        {
            prodEnv1: prodEnv1,
            prodEnv2: prodEnv2,
            pipelineMonEnv: pipelineMonEnv,
            monitoringEnv: monitoringEnv
        })
    .catch(() => {
        logger.info("Pipeline pattern is not setup due to missing secrets for GitHub access.");
    });

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
        logger.info("Pipeline pattern is not setup due to missing secrets for GitHub access.");
    });
}
else {
    logger.info("Valid AWS credentials are required to synthesize pipeline stack. Please run 'aws configure'");
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
    logger.info("Dynatrace pattern is not setup due to missing secrets for dynatrace-tokens.");
});

import KubecostConstruct from '../lib/kubecost-construct';
new KubecostConstruct(app, 'kubecost');

import KeptnControlPlaneConstruct from '../lib/keptn-construct';
new KeptnControlPlaneConstruct(app, 'keptn');

import NewRelicConstruct from '../lib/newrelic-construct';
new NewRelicConstruct(app, 'newrelic-cluster');

import DatadogConstruct from '../lib/datadog-construct';

new DatadogConstruct().buildAsync(app, 'datadog').catch((error) => {
    logger.info("Datadog pattern is not setup due to missing secrets: " + error);
});

import KastenK10Construct from '../lib/kasten-k10-construct';
new KastenK10Construct(app, 'kasten');

import SnykConstruct from '../lib/snyk-construct';
new SnykConstruct(app, 'snyk-monitor');

import RafayConstruct from '../lib/rafay-construct';

new RafayConstruct().buildAsync(app, 'rafay-cluster').catch((error) => {
    logger.info("Rafay pattern is not setup due to missing secrets: " + error);
});