import BatchConstruct from '../lib/aws-batch-on-eks-construct';
import { batchTeam } from '../lib/teams/team-batch';
import { configureApp } from '../lib/common/construct-utils';

const app = configureApp();

//-------------------------------------------
// Single cluster with Batch on EKS deployed
//-------------------------------------------
new BatchConstruct().build(app, 'batch', [batchTeam]);