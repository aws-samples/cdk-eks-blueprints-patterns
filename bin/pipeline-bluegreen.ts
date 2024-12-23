import { configureApp, errorHandler } from '../lib/common/construct-utils';
import { PipelineBlueGreenCluster } from '../lib/pipeline-bluegreen-construct/pipeline'


const app = configureApp();

//-------------------------------------------
// Multiple clusters, multiple regions.
//-------------------------------------------

new PipelineBlueGreenCluster().buildAsync(app).catch((error) => {
    errorHandler(app, "Blue Green cluster pattern is not setup. It may be due to missing secrets: ", error);
});