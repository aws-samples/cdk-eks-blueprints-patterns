
import RafayConstruct from '../lib/rafay-construct';
import { configureApp, errorHandler } from '../lib/common/construct-utils';

const app = configureApp();

new RafayConstruct().buildAsync(app, 'rafay-cluster').catch((error) => {
    errorHandler(app, "Rafay pattern is not setup due to missing secrets: " + error);
});