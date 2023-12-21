import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import 'source-map-support/register';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import * as backup from 'aws-cdk-lib/aws-backup';
import { Duration } from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as events from 'aws-cdk-lib/aws-events';


export interface backupStackProps extends cdk.StackProps {
    primaryKeyArn: string,
    drbackupVault: backup.IBackupVault
    //drbackupVault: { "backupVaultArn": string, backupVaultName: string, env: {"account": string , region: string}}
} 


export class backupstack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: backupStackProps ) {
        super(scope, id, props );
        const account = process.env.CDK_DEFAULT_ACCOUNT!;
        const region = blueprints.utils.valueFromContext(scope, "resilience-backup-restore-aws.primary.region", undefined);
        //const drregion = blueprints.utils.valueFromContext(scope, "resilience-backup-restore-aws.dr.region", undefined);
        //const kversion = blueprints.utils.valueFromContext(scope, "resilience-backup-restore-aws.kubernetes.version", undefined);
        const efsfsname = blueprints.utils.valueFromContext(scope, "resilience-backup-restore-aws.efs.fsname", "efs-file-system");
        const efsfstag = 'eks-blueprint/' + efsfsname;
        const vaultname = blueprints.utils.valueFromContext(scope, "resilience-backup-restore-aws.backup.vaultname", "EKSBackupVault");
        const primaryKeyArn = props.primaryKeyArn;
        const drbackupVault = props.drbackupVault;
    
        const backupstack = new cdk.Stack(this, 'backupstack', { env: { region: region, account: account }, crossRegionReferences: true } );
        const primaryKey = kms.Key.fromKeyArn(backupstack, 'PrimaryKey', primaryKeyArn);
        const backupVault = new backup.BackupVault(backupstack, 'BackupVault', {backupVaultName: vaultname, encryptionKey: primaryKey });


        // Create a AWS Backup Backup plan to backup resources based on Tags
        const backupPlan = new backup.BackupPlan(backupstack, 'BackupPlan', {backupPlanName: 'EKSBackupPlan', backupVault: backupVault });
        backupPlan.addRule(new backup.BackupPlanRule({
            copyActions: [{
                destinationBackupVault: drbackupVault,
                moveToColdStorageAfter: Duration.days(30),
                deleteAfter: Duration.days(120),
            }],
            scheduleExpression: events.Schedule.cron({ // Only cron expressions are supported
                day: '*',
                hour: '3',
                minute: '30',
            }),
        }));
        backupPlan.addSelection('EKSResources', {
            resources: [
                backup.BackupResource.fromTag('EKSPVBackup', 'true'),
                backup.BackupResource.fromTag('Name', efsfstag )
            ]
        });
    }
}