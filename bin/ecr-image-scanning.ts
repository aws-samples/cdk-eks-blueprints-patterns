
import { ImageScanningSetupStack } from "../lib/security/image-vulnerability-scanning/image-scanning-setup";
import { configureApp, errorHandler } from '../lib/common/construct-utils';
import ImageScanningWorkloadConstruct from "../lib/security/image-vulnerability-scanning";

const app = configureApp();

new ImageScanningSetupStack(app, "image-scanning-setup");

new ImageScanningWorkloadConstruct().buildAsync(app, "image-scanning-workload").catch((e) => {
    errorHandler(app, "ImageScanningWorkloadConstruct is not setup due to missing secrets for ArgoCD admin pwd", e);
});