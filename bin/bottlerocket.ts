import BottleRocketConstruct from '../lib/bottlerocket-construct';
import { configureApp } from '../lib/common/construct-utils';

const app = configureApp();

//-------------------------------------------
// Single cluster with Bottlerocket nodes.
//-------------------------------------------
new BottleRocketConstruct().build(app, 'bottlerocket');