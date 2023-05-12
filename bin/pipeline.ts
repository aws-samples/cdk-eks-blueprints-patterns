import { configureApp, errorHandler, logger } from '../lib/common/construct-utils';
import PipelineConstruct from '../lib/pipeline-stack';
import * as cdk from 'aws-cdk-lib';

//-------------------------------------------
// Multiple clusters with deployment pipeline.
//-------------------------------------------
const account = process.env.CDK_DEFAULT_ACCOUNT!;
const region = process.env.CDK_DEFAULT_REGION!;
const env: cdk.Environment = { account: account, region: region };
const app = configureApp();

if (account) {
    new PipelineConstruct().buildAsync(app, { env }).catch(() => {
        errorHandler(app, "Pipeline pattern is not setup due to missing secrets for GitHub access.");
    });
}
else {
    logger.info("Valid AWS credentials are required to synthesize pipeline stack. Please run 'aws configure'");
}