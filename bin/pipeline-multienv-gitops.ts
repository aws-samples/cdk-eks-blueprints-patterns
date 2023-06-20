import { configureApp, errorHandler } from '../lib/common/construct-utils';
import PipelineMultiEnvGitops, { populateWithContextDefaults } from '../lib/pipeline-multi-env-gitops';
import * as cdk from 'aws-cdk-lib';


// CDK Default Environment - default account and region
const account = process.env.CDK_DEFAULT_ACCOUNT!;
const region = process.env.CDK_DEFAULT_REGION!;
const env: cdk.Environment = { account: account, region: region };

const app = configureApp();
// These different CDK environments are meant to be used for multi-region/account usage, 
// where the pipeline, dev cluster, and prod cluster are deployed in seperate environments
const { devEnv, pipelineEnv, prodEnv }:
    { devEnv: cdk.Environment; pipelineEnv: cdk.Environment; prodEnv: cdk.Environment; } =
    populateWithContextDefaults(app, account, region);

//--------------------------------------------------------------------------
// Multiple clusters, multiple reginos ,multiple teams, GitOps bootstrapped.
//--------------------------------------------------------------------------
new PipelineMultiEnvGitops()
    .buildAsync(app, 'pipeline-multi-env',
        {
            devEnv: devEnv,
            pipelineEnv: pipelineEnv,
            prodEnv: prodEnv,
        },
        { env })
    .catch((e) => {
        errorHandler(app, "Pipeline pattern is not setup due to missing secrets for GitHub access.", e);
    });