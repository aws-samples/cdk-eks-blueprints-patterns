#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import {K8S_VERSIONS_DEV, MultiClusterOptions} from "./multi-cluster-options";
import {CapacityType, KubernetesVersion} from "aws-cdk-lib/aws-eks";
import MultiClusterPipelineConstruct from "./multi-cluster-pipeline";
import * as blueprints from "@aws-quickstart/eks-blueprints";
import * as eks from "aws-cdk-lib/aws-eks";
import * as ec2 from "aws-cdk-lib/aws-ec2";

const app = new cdk.App();

const account = process.env.CDK_DEFAULT_ACCOUNT ?? "";
const region = process.env.CDK_DEFAULT_REGION ?? "us-east-1";
const minSize  =  parseInt(process.env.NODEGROUP_MIN ?? "1");
const maxSize  =  parseInt(process.env.NODEGROUP_MAX ?? "3");
const desiredSize  =  parseInt(process.env.NODEGROUP_DESIRED ?? "1");
const gitHubSecret = process.env.GITHUB_SECRET ?? "cdk_blueprints_github_secret";

const env : MultiClusterOptions = {
    account,
    region,
    minSize,
    maxSize,
    desiredSize,
    gitHubSecret,
    nodeGroupCapacityType: CapacityType.ON_DEMAND,
    k8sVersions: K8S_VERSIONS_DEV // K8S_VERSIONS_PROD for full deploy
}


const mngProps: blueprints.MngClusterProviderProps = {
    version: KubernetesVersion.V1_28,
    instanceTypes: [ec2.InstanceType.of(ec2.InstanceClass.M5, ec2.InstanceSize.XLARGE2)],
    amiType: eks.NodegroupAmiType.AL2_X86_64,
    desiredSize: 2,
    maxSize: 3,
};

console.info("Running CDK with id: addon-tester" );
console.info("Running CDK with: " + JSON.stringify(env));

new MultiClusterPipelineConstruct().buildAsync(app,  "addon-tester", env , mngProps).catch(
    (e) => console.log("Pipeline construct failed because of error ", e)
);

