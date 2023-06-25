import { BackstageConstruct } from '../lib/backstage-construct';
import { configureApp } from '../lib/common/construct-utils';

const app = configureApp();

new BackstageConstruct(app, 'backstage-stack');
