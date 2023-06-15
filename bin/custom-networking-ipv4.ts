import CustomNetworkingIPv4Construct from '../lib/custom-networking-ipv4-construct';
import { configureApp } from '../lib/common/construct-utils';

const app = configureApp();
new CustomNetworkingIPv4Construct(app, 'custom-networking-ipv4');