# Custom Networking on EKS
On Amazon EKS clusters, the default Container Networking Interface(CNI) is implemented by the Amazon VPC CNI plugin. When VPC CNI is used in EKS clusters, by default the VPC CNI assigns Pods an IP address that's selected from the primary subnet of the VPC. The primary subnet is the subnet CIDR that the primary Elastic Network Interface(ENI) is attached to; usually it's the subnet of the worker node/host in the EKS cluster. If the primary subnet CIDR is too small, the CNI may not be able to have enough IP addresses to assign to the Pods running in the cluster. This is a common challenge for EKS IPv4 clusters.

Custom Networking provides a solution to the IP exhaustion issue by assigning the Pod IPs from secondary VPC address spaces(CIDR). When custom networking is enabled in VPC CNI, it creates secondary ENIs in the subnet defined under a custom resource named ENIConfig that includes an alternate subnet CIDR range (carved from a secondary VPC CIDR). The VPC CNI assigns Pods IP addresses from the CIDR range defined in the ENIConfig Custom Resource Definition(CRD).

Using the Custom Networking with IPv4 pattern, you should be able to stand up an EKS cluster with VPC CNI installed and configured with custom networking enabled.


This pattern deploys the following resources:

- Creates EKS Cluster Control plane with a managed node group 
- Deploys supporting add-ons: VpcCni, CoreDns, KubeProxy
- Enables Custom Networking configuration in VpcCni AddOn 



## Prerequisites:

Ensure that you have installed the following tools on your machine.

1. [aws cli](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)
2. [kubectl](https://Kubernetes.io/docs/tasks/tools/)
3. [cdk](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html#getting_started_install)
4. [npm](https://docs.npmjs.com/cli/v8/commands/npm-install)

Amazon EKS add-ons are only available with Amazon EKS clusters running Kubernetes version 1.18 and later.

## Usage

This pattern  first creates Secondary CIDRs and Secondary Subnets with specified range of CIDRs as shown below in `resourceProvider` command. Then the VPC CNI addon sets up custom networking based on the parameters `awsVpcK8sCniCustomNetworkCfg`, `eniConfigLabelDef: "topology.kubernetes.io/zone"` for your Amazon EKS cluster workloads with created secondary subnet ranges. This way, when customers experience IP exhaustion in the Primary CIDR, they can use the Secondary CIDRs to assign IP addresses to the application Pods. 

Note: 
- When the secondary CIDRs are passed to the VPC resource provider, the secondary subnets are created and registered under names `secondary-cidr-subnet-${order}` with the resource providers.
- We enable CNI plugin with custom pod networking with environment variables
    -   AWS_VPC_K8S_CNI_CUSTOM_NETWORK_CFG = true
    -   ENI_CONFIG_LABEL_DEF = topology.kubernetes.io/zone
This deploys an `ENIConfig` custom resource for pod subnets (one per availability zone).

```typescript
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as blueprints from '@aws-quickstart/eks-blueprints';

const app = new cdk.App();

const addOn = new blueprints.addons.VpcCniAddOn({
  customNetworkingConfig: {
      subnets: [
          blueprints.getNamedResource("secondary-cidr-subnet-0"),
          blueprints.getNamedResource("secondary-cidr-subnet-1"),
          blueprints.getNamedResource("secondary-cidr-subnet-2"),
      ]   
  },
  awsVpcK8sCniCustomNetworkCfg: true,
  eniConfigLabelDef: 'topology.kubernetes.io/zone'
});

const blueprint = blueprints.EksBlueprint.builder()
  .addOns(addOn)
  .resourceProvider(blueprints.GlobalResources.Vpc, new VpcProvider(undefined,"100.64.0.0/24",["100.64.0.0/25","100.64.0.128/26","100.64.0.192/26"],))
  .build(app, 'my-stack-name');
```



### Additional Configuration Options


## Deploy EKS Cluster with Amazon EKS Blueprints for CDK

Clone the repository

```sh
git clone https://github.com/aws-samples/cdk-eks-blueprints-patterns.git
```

Updating npm

```sh
npm install -g npm@latest
```

To view patterns and deploy custom networking with ipv4 pattern

```sh
npm i
make build
cdk list
cdk bootstrap
cdk deploy custom-networking-ipv4-blueprint
```


## Verify the resources


Run update-kubeconfig command. You should be able to get the command from CDK output message. More information can be found at https://aws-quickstart.github.io/cdk-eks-blueprints/getting-started/#cluster-access
```sh
aws eks update-kubeconfig --name <your cluster name> --region <your region> --role-arn arn:aws:iam::xxxxxxxxx:role/kubeflow-blueprint-kubeflowblueprintMastersRole0C1-saJBO
```

Let’s verify the resources created by Steps above.
```sh
kubectl get nodes # Output shows the EKS Managed Node group nodes

kubectl get ns | kubeflow # Output shows kubeflow namespace

kubectl get pods --namespace=kubeflow-pipelines  # Output shows kubeflow pods
```


## Execute Machine learning jobs on Kubeflow
log into Kubeflow pipeline UI by creating a port-forward to the ml-pipeline-ui service<br>

```sh
kubectl port-forward svc/ml-pipeline-ui 9000:80 -n =kubeflow-pipelines

```
and open this browser: http://localhost:9000/#/pipelines
more pipeline examples can be found at https://www.kubeflow.org/docs/components/pipelines/tutorials/


## Cleanup

To clean up your EKS Blueprints, run the following commands:


```sh
cdk destroy custom-networking-ipv4-blueprint 

```

## Disclaimer 

