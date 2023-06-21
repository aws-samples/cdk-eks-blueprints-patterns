import { configureApp, errorHandler } from '../lib/common/construct-utils';
import GravitonConstruct from "../lib/graviton-construct";

const app = configureApp();

new GravitonConstruct().buildAsync(app, 'graviton').catch((e) => {
    errorHandler(app, "Graviton pattern is not setup. This maybe due to missing Hosted Zone Context.", e);
});
