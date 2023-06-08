import { configureApp, errorHandler } from '../lib/common/construct-utils';
import InstanaConstruct from '../lib/instana-construct';

const app = configureApp();

new InstanaConstruct().buildAsync(app).catch(() => {
    errorHandler(app, "Instana pattern is not setup due to invalid parameters/environment variables");
});