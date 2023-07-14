import { configureApp, errorHandler } from '../lib/common/construct-utils';
import { ImportClusterConstruct } from '../lib/import-cluster';



const app = configureApp();

//-------------------------------------------
// Multiple clusters, multiple regions.
//-------------------------------------------

new ImportClusterConstruct().build(app).catch((error) => {
    errorHandler(app, "Import cluster construct failed to import cluster", error);
});