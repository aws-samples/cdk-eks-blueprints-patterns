import { configureApp, errorHandler } from '../lib/common/construct-utils';
import MultiRegionConstruct from '../lib/multi-region-construct';


const app = configureApp();

//-------------------------------------------
// Multiple clusters, multiple regions.
//-------------------------------------------

new MultiRegionConstruct().buildAsync(app, 'multi-region').catch((error) => {
    errorHandler(app, "Multi region pattern is not setup. It may be due to missing secrets: ", error);
});