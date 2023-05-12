
import { configureApp } from '../lib/common/construct-utils';
import FargateConstruct from '../lib/fargate-construct';

new FargateConstruct(configureApp(), 'fargate');