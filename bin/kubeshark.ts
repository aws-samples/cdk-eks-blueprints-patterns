import KubesharkConstruct from '../lib/kubeshark-construct';
import { configureApp } from '../lib/common/construct-utils';

const app = configureApp();

new KubesharkConstruct(app, 'kubeshark');