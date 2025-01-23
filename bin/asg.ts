import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as blueprints from '@aws-quickstart/eks-blueprints';

import { configureApp } from "../lib/common/construct-utils";

const app = configureApp();

const spotInterruptHandlerAddOn = new blueprints.addons.AwsNodeTerminationHandlerAddOn({
        version: "0.25.1",
        repository: 'oci://public.ecr.aws/aws-ec2/helm/aws-node-termination-handler'
    });

const clusterProvider = new blueprints.AsgClusterProvider({
    version: cdk.aws_eks.KubernetesVersion.V1_30,
    minSize: 1, maxSize: 1, spotPrice: "0.10",
    machineImageType: cdk.aws_eks.MachineImageType.BOTTLEROCKET,
    id: "asg-spot",
    name: "asg-spot",
    spotInterruptHandler: false
});

const blueprint = blueprints.EksBlueprint.builder()
    .region("us-west-2")
    .version("auto")
    .clusterProvider(clusterProvider)
    .addOns(spotInterruptHandlerAddOn)
    .build(app, 'asg-test');