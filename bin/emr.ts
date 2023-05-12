import EmrEksConstruct from '../lib/emr-eks';
import { dataTeam } from '../lib/teams/team-emr-on-eks';
import { configureApp } from '../lib/common/construct-utils';

const app = configureApp();

new EmrEksConstruct().build(app, 'emrOnEks', [dataTeam]);