import SnykConstruct from '../lib/snyk-construct';
import { configureApp } from '../lib/common/construct-utils';

const app = configureApp();

new SnykConstruct(app, 'snyk-monitor');