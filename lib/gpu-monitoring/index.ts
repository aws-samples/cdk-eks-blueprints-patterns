import 'source-map-support/register';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import { KubecostAddOn } from '@kubecost/kubecost-eks-blueprints-addon';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { prevalidateSecrets } from '../common/construct-utils';
import { SECRET_ARGO_ADMIN_PWD } from '../multi-region-construct';
import * as eks from "aws-cdk-lib/aws-eks";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { ValuesSchema } from '@aws-quickstart/eks-blueprints/dist/addons/gpu-operator/values';

const gitUrl = 'https://github.com/aws-samples/eks-blueprints-workloads.git';

const defaultOptions: blueprints.GpuOptions = {
    kubernetesVersion: eks.KubernetesVersion.of("1.27"),
    instanceClass: ec2.InstanceClass.G5,
    instanceSize: ec2.InstanceSize.XLARGE,
    desiredNodeSize: 2,
    minNodeSize: 2,
    maxNodeSize: 3,
    blockDeviceSize:50,
    clusterProviderTags: {
        "Name": "blueprints-gpu-eks-cluster",
        "Type": "generic-gpu-cluster"
    },
    nodeGroupTags: {
        "Name": "Mng-linux-Gpu",
        "Type": "Managed-linux-Gpu-Node-Group",
        "LaunchTemplate": "Linux-Launch-Template",
    }
  };
  
//   const gpuOperatorConfValues: ValuesSchema = {
//         driver: {
//           enabled: true
//         },
//         mig: {
//           strategy: 'mixed'
//         },
//         devicePlugin: {
//           enabled: true,
//           version: 'v0.13.0'
//         },
//         migManager: {
//           enabled: true,
//           WITH_REBOOT: true
//         },
//         toolkit: {
//           version: 'v1.13.1-centos7'
//         },
//         operator: {
//           defaultRuntime: 'containerd'
//         },
//         gfd: {
//           version: 'v0.8.0'
//         }
// } 

export default class GpuMonitoringConstruct extends cdk.Stack{

    async buildAsync(scope: Construct, id: string) {

        await prevalidateSecrets(GpuMonitoringConstruct.name, undefined, SECRET_ARGO_ADMIN_PWD);

        blueprints.HelmAddOn.validateHelmVersions = false;

        await blueprints.GpuBuilder.builder(defaultOptions)
            .account(process.env.CDK_DEFAULT_ACCOUNT)
            .region(process.env.CDK_DEFAULT_REGION)
            .enableGpu()
            .addOns(
                new KubecostAddOn(),
                new blueprints.addons.EbsCsiDriverAddOn(),
                new blueprints.SecretsStoreAddOn({ rotationPollInterval: "120s" }),
                new blueprints.SSMAgentAddOn(),
                new blueprints.ArgoCDAddOn({
                    bootstrapRepo: {
                        repoUrl: gitUrl,
                        targetRevision: "main",
                        path: 'secure-ingress-cognito/envs/dev'
                    },
                    adminPasswordSecretName: SECRET_ARGO_ADMIN_PWD,
                }),
            )
            .version("auto")
            .buildAsync(scope, `${id}-blueprint`);

        blueprints.HelmAddOn.validateHelmVersions = false; 
    }
}


