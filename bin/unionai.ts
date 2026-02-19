import UnionDataplaneConstruct from '../lib/union-dataplane-construct';
import { configureApp, errorHandler } from '../lib/common/construct-utils';

const app = configureApp();

new UnionDataplaneConstruct().buildAsync(app, 'union-ai-datplane').catch((e) => {
    errorHandler(app, "Union Dataplane Construct pattern is not setup due to missing secrets for Union client. See Union Dataplane Construct in the readme for instructions", e);
});
