# Windows Nodes on EKS

Legacy applications in many industryes tend to run on Windows. Customers want to scale these workloads on Kubernetes alongside their Linux workloads. Amazon EKS supports windows node groups and you can Windows worker node group to an Amazon EKS cluster. This pattern will deploy an Creates EKS Cluster Control plane with a managed node group running windows node. Please check our AWS doc on [Enabling Windows support for your Amazon EKS cluster](https://docs.aws.amazon.com/eks/latest/userguide/windows-support.html) to learn more about considerations, prerequisites in running windows nodes with EKS cluster. Also please reference this AWS doc to learn about [Amazon EKS optimized Windows AMIs](https://docs.aws.amazon.com/eks/latest/userguide/eks-optimized-windows-ami.html).

### Addons
Not all of the listed EKS addons support windows. We are currently working a list of supported addons documentation which will be available at [documentation](https://github.com/aws-quickstart/cdk-eks-blueprints/blob/main/docs/addons/index.md).

## Prerequisites

Ensure that you have installed the following tools on your machine.

1. [aws cli](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)
2. [kubectl](https://Kubernetes.io/docs/tasks/tools/)
3. [cdk](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html#getting_started_install)
4. [npm](https://docs.npmjs.com/cli/v8/commands/npm-install)
5. `make`

## Deploy EKS Cluster with Amazon EKS Blueprints for CDK

Clone the repository

```sh
git clone https://github.com/aws-samples/cdk-eks-blueprints-patterns.git
cd cdk-eks-blueprints-patterns
```

Updating npm

```sh
npm install -g npm@latest
```

To view patterns and deploy kubeflow pattern

```sh
make list
npx cdk bootstrap
make pattern windows deploy
```

## Verify the resources

Run the update-kubeconfig command. You should be able to get the command from the CDK output message. More information can be found at https://aws-quickstart.github.io/cdk-eks-blueprints/getting-started/#cluster-access

```sh
aws eks update-kubeconfig --name windows-eks-blueprint --region <your region> --role-arn arn:aws:iam::xxxxxxxxx:role/windows-construct-bluepr-windowsconstructbluepri-1OZNO42GH3OCB
```

Let's verify the resources created from the steps above.

```sh
kubectl get nodes -o json | jq -r '.items[] | "Name: ",.metadata.name,"\nInstance Type: ",.metadata.labels."beta.kubernetes.io/instance-type","\nOS Type: ",.metadata.labels."beta.kubernetes.io/os","\n"' # Output shows Windows and Linux Nodes
```

## Cleanup

To clean up your EKS Blueprint, run the following command:

```sh
make pattern windows destroy
```
