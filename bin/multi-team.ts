import { configureApp } from '../lib/common/construct-utils';
import MultiTeamConstruct from '../lib/multi-team-construct';

const app = configureApp();

//-------------------------------------------
// Single Cluster with multiple teams.
//-------------------------------------------

new MultiTeamConstruct(app, 'multi-team');