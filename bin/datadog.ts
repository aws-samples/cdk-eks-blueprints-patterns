import DatadogConstruct from '../lib/datadog-construct';
import { configureApp, errorHandler } from '../lib/common/construct-utils';

const app = configureApp();

new DatadogConstruct().buildAsync(app, 'datadog').catch((error) => {
    errorHandler(app, "Datadog pattern is not setup due to missing secrets: " + error);
});