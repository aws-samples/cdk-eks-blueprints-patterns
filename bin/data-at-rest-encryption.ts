import EncryptionAtRestConstruct from "../lib/security/data-at-rest-encryption";
import { configureApp, errorHandler } from '../lib/common/construct-utils';


//--------------------------------------------------------------------------
// Security Patterns
//--------------------------------------------------------------------------

const app = configureApp();
new EncryptionAtRestConstruct().buildAsync(app, "data-at-rest-encryption").catch((e) => {
    errorHandler(app, "EncryptionAtRestConstruct is not setup due to missing secrets for ArgoCD admin pwd", e);
});
