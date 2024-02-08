import { configureApp, errorHandler } from '../lib/common/construct-utils';
import { PipelineMultiCluster } from '../lib/multi-cluster-construct';


const app = configureApp();

//-------------------------------------------
// Multiple clusters, multiple regions.
//-------------------------------------------

new PipelineMultiCluster().buildAsync(app).catch((error) => {
    errorHandler(app, "Multi cluster pattern is not setup. It may be due to missing secrets: ", error);
});