
import JupyterHubConstruct from '../lib/jupyterhub-construct';
import { configureApp } from '../lib/common/construct-utils';

const account = process.env.CDK_DEFAULT_ACCOUNT!;
const region = process.env.CDK_DEFAULT_REGION!;

const app = configureApp();

new JupyterHubConstruct(app, 'jupyterhub', { env: { account, region } });