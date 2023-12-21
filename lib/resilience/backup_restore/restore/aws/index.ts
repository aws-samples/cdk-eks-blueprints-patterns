import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import 'source-map-support/register';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import { drstack } from './drstack';


export default class ResilienceBRAWSConstruct {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    
    const app = new cdk.App();
    const account = process.env.CDK_DEFAULT_ACCOUNT!;
    const region = blueprints.utils.valueFromContext(scope, "resilience-backup-restore-aws.primary.region", undefined);
    const drregion = blueprints.utils.valueFromContext(scope, "resilience-backup-restore-aws.dr.region", undefined);
    const kversion = blueprints.utils.valueFromContext(scope, "resilience-backup-restore-aws.kubernetes.version", undefined);
    const efsfsname = blueprints.utils.valueFromContext(scope, "resilience-backup-restore-aws.efs.fsname", "efs-file-system");
    const efsfstag = 'eks-blueprint/' + efsfsname
    const vaultname = blueprints.utils.valueFromContext(scope, "resilience-backup-restore-aws.backup.vaultname", "EKSBackupVault");
    
    
    
    const bootstrapRepo: blueprints.ApplicationRepository = {
        repoUrl: 'https://github.com/prabaksa/eks-blueprints-workloads'
    }
    
    const addOns: Array<blueprints.ClusterAddOn> = [
	    new blueprints.addons.EbsCsiDriverAddOn(),
	    new blueprints.addons.EfsCsiDriverAddOn(),
	    new blueprints.addons.VpcCniAddOn(),
	    new blueprints.addons.CoreDnsAddOn(),
	    new blueprints.addons.KubeProxyAddOn(),
	    new blueprints.addons.AwsLoadBalancerControllerAddOn(),
	    new blueprints.addons.ArgoCDAddOn({
                bootstrapRepo: {
                    ...bootstrapRepo,
                    path: './teams/team-rbraws/DR/manifests/StorageClass',
                     },})
];

const clusterProvider = new blueprints.GenericClusterProvider({
    version: eks.KubernetesVersion.V1_27,
    tags: {
        "Name": "backup-example-cluster",
        "Type": "generic-cluster"
    },
    managedNodeGroups: [
        {
            id: "mng1",
            amiType: eks.NodegroupAmiType.AL2_X86_64,
            instanceTypes: [new ec2.InstanceType('m5.2xlarge')],
            desiredSize: 2,
            enableSsmPermissions: true,
            maxSize: 3, 
            nodeGroupSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
            launchTemplate: {
                // You can pass Custom Tags to Launch Templates which gets propagated to worker nodes.
                tags: {
                    "EKSPVBackup": "true",
                    "Type": "Managed-Node-Group",
                    "Instance": "ONDEMAND"
                }
            }
        }
        
    ]
});

const stack = blueprints.EksBlueprint.builder()
    .resourceProvider(blueprints.GlobalResources.Vpc, new blueprints.VpcProvider())
    .resourceProvider("efs-file-system", new blueprints.CreateEfsFileSystemProvider({name: efsfsname }))
    .account(account)
    .clusterProvider(clusterProvider)
    .region(region)
    .addOns(...addOns)
    .build(app, 'eks-blueprint');



// Create a Multi-region KMS key using CfnKey
const keyPolicy = new iam.PolicyDocument({
  statements: [new iam.PolicyStatement({
    actions: [
      'kms:*',
    ],
    principals: [new iam.AccountRootPrincipal()],
    resources: ['*'],
  })],
});

const kmsKey = new kms.CfnKey(stack, 'KMSKey', {
    keyPolicy: keyPolicy,
    enableKeyRotation: true,
    multiRegion: true,
    enabled: true,
    pendingWindowInDays: 30
});

const kmsAlias = new kms.CfnAlias(stack, 'KMSAlias', {
  aliasName: 'alias/eks-blueprint',
  targetKeyId: kmsKey.attrKeyId,
});


const drstackProps = {
            primaryKeyArn: kmsKey.attrArn,
            env: {
                account: process.env.CDK_DEFAULT_ACCOUNT!,
                region: drregion
            }
        };
        
new drstack(stack, 'drstack', drstackProps)
  }
}
