import WorkloadsCodeCommitConstruct from '../lib/workloads-codecommit-construct';
import { configureApp } from '../lib/common/construct-utils';

const app = configureApp();

new WorkloadsCodeCommitConstruct(app, 'workloads-codecommit');
