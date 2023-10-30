import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
//import { NestedStack, Stack, NestedStackProps } from 'aws-cdk-lib';
import 'source-map-support/register';
//import * as eks from 'aws-cdk-lib/aws-eks';
import * as blueprints from '@aws-quickstart/eks-blueprints';
//import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as backup from 'aws-cdk-lib/aws-backup';
//import { Duration } from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
//import * as events from 'aws-cdk-lib/aws-events';
//import * as utils from "@aws-quickstart/eks-blueprints/dist/utils";
import { backupstack } from './backupstack';

/**
 * Defines properties for the AMG IAM setup. 
 */
export interface drstackProps extends cdk.StackProps {
    /**
     * Arn of the KMS Key on the Primary region used to create ReplicaKey
     */
    primaryKeyArn: string
} 

export class drstack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: drstackProps) {
    super(scope, id, props );
    
    //const app = new cdk.App();
    const account = process.env.CDK_DEFAULT_ACCOUNT!;
    const region = blueprints.utils.valueFromContext(scope, "resilience-backup-restore-aws.primary.region", undefined);
    const drregion = blueprints.utils.valueFromContext(scope, "resilience-backup-restore-aws.dr.region", undefined);
    //const kversion = blueprints.utils.valueFromContext(scope, "resilience-backup-restore-aws.kubernetes.version", undefined);
    const efsfsname = blueprints.utils.valueFromContext(scope, "resilience-backup-restore-aws.efs.fsname", "efs-file-system");
    //const efsfstag = 'eks-blueprint/' + efsfsname
    const vaultname = blueprints.utils.valueFromContext(scope, "resilience-backup-restore-aws.backup.vaultname", "EKSBackupVault");
    //const keyPolicy = props.keyPolicy;
    const primaryKeyArn = props.primaryKeyArn;
    
    const keyPolicy = new iam.PolicyDocument({
        statements: [new iam.PolicyStatement({
        actions: [
          'kms:*',
        ],
        principals: [new iam.AccountRootPrincipal()],
        resources: ['*'],
      })],
    });
    
    // Create a AWS Backup Vault in Disaster Recovery Region
    const drstack = new cdk.Stack(this, 'drstack', { env: { region: drregion, account: account }, crossRegionReferences: true } );
    const cfnReplicaKey = new kms.CfnReplicaKey(drstack, 'KMSKey', {
      keyPolicy: keyPolicy,
      primaryKeyArn: primaryKeyArn
    })
    const replicaKey = kms.Key.fromKeyArn(drstack, 'ReplicaKey', cfnReplicaKey.attrArn);
    const drbackupVault = new backup.BackupVault(drstack, 'BackupVault', {backupVaultName: vaultname , encryptionKey: replicaKey  });
    
    
    const  backupStackProps = {
            primaryKeyArn: props.primaryKeyArn,
            //drbackupVault: { "backupVaultArn": drbackupVault.attrArn, backupVaultName: drbackupVault.attrName, env: {"account": process.env.CDK_DEFAULT_ACCOUNT! , region: drregion}} 
            drbackupVault: drbackupVault,
            env: {
                account: process.env.CDK_DEFAULT_ACCOUNT!,
                region: region
            }
        };
    
    new backupstack(this, 'backupstack', backupStackProps )    
    //backupstack.addDependency(drstack);

  }
}


      