
import { configureApp, errorHandler } from '../lib/common/construct-utils';
import { PipelineMultiEnvMonitoring } from '../lib/multi-account-monitoring';

const app = configureApp();

//--------------------------------------------------------------------------
// Multiple clusters, multiple accounts, pipeline and Monitoring
//--------------------------------------------------------------------------
new PipelineMultiEnvMonitoring()
    .buildAsync(app)
    .catch((e) => {
        errorHandler(app, "Multi Account Monitoring pattern is not setup due to missing secrets for GitHub \
        access and/or CDK Context. See Multi Account Monitoring in the readme for instructions", e);
    });