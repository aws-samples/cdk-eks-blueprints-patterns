import ParalusConstruct from '../lib/paralus-construct';
import { configureApp } from '../lib/common/construct-utils';

const app = configureApp();

new ParalusConstruct(app, 'paralus');