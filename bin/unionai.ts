import UnionDataplaneConstruct from '../lib/union-dataplane-construct';
import { configureApp } from '../lib/common/construct-utils';

const app = configureApp();

new UnionDataplaneConstruct().buildAsync(app, 'union-ai-datplane');
