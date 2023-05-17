import NewRelicConstruct from '../lib/newrelic-construct';
import { configureApp } from '../lib/common/construct-utils';

const app = configureApp();

new NewRelicConstruct(app, 'newrelic-cluster');
