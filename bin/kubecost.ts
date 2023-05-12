import KubecostConstruct from '../lib/kubecost-construct';
import { configureApp } from '../lib/common/construct-utils';

const app = configureApp();

new KubecostConstruct(app, 'kubecost');