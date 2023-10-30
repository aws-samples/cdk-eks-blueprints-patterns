import { configureApp } from '../lib/common/construct-utils';
import ResilienceBRAWSConstruct from '../lib/resilience-backup-restore-aws-construct';

//const app = configureApp();

//-------------------------------------------
// Single cluster with pre-configured Storage Classes, Backupvaults on Primary and DR Region
//-------------------------------------------
new ResilienceBRAWSConstruct(configureApp(), 'resiliencebraws');