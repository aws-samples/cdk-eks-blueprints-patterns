import InferentiaConstruct from '../lib/inferentia-construct';
import { configureApp } from '../lib/common/construct-utils';

const app = configureApp();

new InferentiaConstruct(app, 'inferentia');