import KeptnControlPlaneConstruct from '../lib/keptn-construct';
import { configureApp } from '../lib/common/construct-utils';

const app = configureApp();

new KeptnControlPlaneConstruct(app, 'keptn');