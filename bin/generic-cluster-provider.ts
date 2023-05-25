import { configureApp } from '../lib/common/construct-utils';
import GenericClusterConstruct from '../lib/generic-cluster-construct';

const app = configureApp();

//-------------------------------------------
// Single cluster with custom configuration.
//-------------------------------------------
new GenericClusterConstruct().build(app, 'generic-cluster');