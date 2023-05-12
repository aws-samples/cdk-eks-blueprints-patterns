import KubeflowConstruct from '../lib/kubeflow-construct';
import { configureApp } from '../lib/common/construct-utils';

const app = configureApp();

new KubeflowConstruct(app, 'kubeflow');