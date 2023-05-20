
import KastenK10Construct from '../lib/kasten-k10-construct';
import { configureApp } from '../lib/common/construct-utils';

const app = configureApp();

new KastenK10Construct(app, 'kasten');