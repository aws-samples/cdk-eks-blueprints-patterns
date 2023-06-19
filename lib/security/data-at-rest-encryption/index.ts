import * as blueprints from "@aws-quickstart/eks-blueprints";
import {
    ArgoCDAddOn,
    EbsCsiDriverAddOn,
    EksBlueprint,
    GlobalResources,
} from "@aws-quickstart/eks-blueprints";
import * as efs from "aws-cdk-lib/aws-efs";
import * as kms from "aws-cdk-lib/aws-kms";
import { prevalidateSecrets } from "../../common/construct-utils";
import { Construct } from "constructs";
import { SECRET_ARGO_ADMIN_PWD } from "../../multi-region-construct";

const gitUrl = "https://github.com/aws-samples/eks-blueprints-workloads.git";
const targetRevision = "main";

export default class DataAtRestEncryptionConstruct {
    async buildAsync(scope: Construct, id: string) {
    
        await prevalidateSecrets(DataAtRestEncryptionConstruct.name, process.env.CDK_DEFAULT_REGION!, SECRET_ARGO_ADMIN_PWD);
    
        const stackId = `${id}-blueprint`;

        const ebsKmsKeyName = "ebs-kms-encryption-key";
        const ebsKmsKey = blueprints.getNamedResource(ebsKmsKeyName) as kms.Key;

        const efsKmsKeyName = "efs-kms-encryption-key";
        const efsKmsKey = blueprints.getNamedResource(efsKmsKeyName) as kms.Key;

        const efsFileSystemName = "efs-file-system";
        const efsFileSystem = blueprints.getNamedResource(
            efsFileSystemName
        ) as efs.FileSystem;

        await EksBlueprint.builder()
            .resourceProvider(GlobalResources.Vpc, new blueprints.VpcProvider())
        // create KMS keys
            .resourceProvider(
                GlobalResources.KmsKey,
                new blueprints.CreateKmsKeyProvider()
            )
            .resourceProvider(
                ebsKmsKeyName,
                new blueprints.CreateKmsKeyProvider(ebsKmsKeyName)
            )
            .resourceProvider(
                efsKmsKeyName,
                new blueprints.CreateKmsKeyProvider(efsKmsKeyName)
            )
        // create EFS file system
            .resourceProvider(
                efsFileSystemName,
                new blueprints.CreateEfsFileSystemProvider({
                    name: efsFileSystemName,
                    kmsKeyResourceName: efsKmsKeyName,
                    efsProps: {
                        encrypted: true,
                    },
                })
            )
            .addOns(
                new EbsCsiDriverAddOn({
                    kmsKeys: [ebsKmsKey],
                }),
                new blueprints.EfsCsiDriverAddOn({
                    kmsKeys: [efsKmsKey],
                }),
                new ArgoCDAddOn({
                    bootstrapRepo: {
                        repoUrl: gitUrl,
                        targetRevision: targetRevision,
                        path: "security/envs/dev",
                    },
                    bootstrapValues: {
                        spec: {
                            efsKmsKey: efsKmsKey.keyArn,
                            efsFileSystemId: efsFileSystem.fileSystemId,
                            ebsKmsKey: ebsKmsKey.keyArn,
                        },
                    },
                    adminPasswordSecretName: SECRET_ARGO_ADMIN_PWD,
                })
            )
            .teams()
            .buildAsync(scope, stackId);
    }
}
