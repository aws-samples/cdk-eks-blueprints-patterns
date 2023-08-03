
import { configureApp } from '../lib/common/construct-utils';
import GitlabRunnerConstruct from '../lib/gitlab-runner-pattern';

new GitlabRunnerConstruct(configureApp(), 'gitlab');