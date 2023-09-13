import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as eks from "aws-cdk-lib/aws-eks";
import { Construct } from "constructs";
import { GpuBuilder, GpuOptions } from "@aws-quickstart/eks-blueprints";

export default class GpuConstruct {
    build(scope: Construct, id: string) {
        const account = process.env.CDK_DEFAULT_ACCOUNT!;
        const region = process.env.CDK_DEFAULT_REGION!;
        const stackID = `${id}-eks-blueprint`;

        const options: GpuOptions = {
            kubernetesVersion: eks.KubernetesVersion.of("1.27"),
            instanceClass: ec2.InstanceClass.G5,
            instanceSize: ec2.InstanceSize.XLARGE12
        };

        const values = {
            driver: {
                enabled: true
            },
            mig: {
                strategy: 'mixed'
            },
            devicePlugin: {
                enabled: true,
                version: 'v0.13.0'
            },
            migManager: {
                enabled: true,
                WITH_REBOOT: true
            },
            toolkit: {
                version: 'v1.13.1-centos7'
            },
            operator: {
                defaultRuntime: 'containerd'
            },
            gfd: {
                version: 'v0.8.0'
            }
        };

        GpuBuilder.builder(options)
            .account(account)
            .region(region)
            .enableGpu({values})
            .build(scope, stackID);
    }
}