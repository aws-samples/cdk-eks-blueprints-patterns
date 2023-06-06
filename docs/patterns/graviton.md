# Graviton on EKS

AWS Graviton processors are designed by AWS to deliver the best price performance for your cloud workloads running in Amazon EC2.

AWS Graviton processors are supported by many Linux operating systems including Amazon Linux 2, Red Hat Enterprise Linux, SUSE, and Ubuntu. Many popular applications and services for security, monitoring and management, containers, and continuous integration and delivery (CI/CD) from AWS and software partners also support AWS Graviton-based instances.

AWS Graviton processors feature key capabilities that enable you to run cloud native applications securely, and at scale. EC2 instances powered by AWS Graviton processors are built on the AWS Nitro System that features the AWS Nitro security chip with dedicated hardware and software for security functions, and support for encrypted Amazon Elastic Block Store (EBS) volumes by default.

### Why an M7g instance?
There are 7 families of Graviton instances split into 5 categories.
General Purpose: M and T families
Compute Optimized: C family
Memory Optimized: R and X family
Storage Optimized: I family
Accelerated Computing: G family

For a blueprint pattern, the General Purpose and Compute Optimized categories make the most sense, since they are the most common use cases.  In these categories, there are 7 different instance types: M7g, M6g, T4g, C7g, C7gn, C6g, and C6gn.  T4g instances are specialized for burstable workloads, and both T4g and M6g instances are Graviton2 chips. M7g instances are Graviton3 chips, which offer 25% better compute performace than Graviton2 and support DDR5 memory that provides 50% more bandwith compared to DDR4. C6g and C6gn instances are also Graviton2 chips, and C7g instances are specialized for high performance computing.  For this general blueprint pattern, the M7g instance is the best option due to the high compute power, memory bandwith, networking bandwith, and broad use cases.

This pattern deploys the following resources:

- Creates EKS Cluster Control plane with a managed node group running on an M family Graviton3 processor

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
make pattern graviton deploy
```

## Verify the resources

Run the update-kubeconfig command. You should be able to get the command from the CDK output message. More information can be found at https://aws-quickstart.github.io/cdk-eks-blueprints/getting-started/#cluster-access

```sh
aws eks update-kubeconfig --name graviton-blueprint --region <your region> --role-arn arn:aws:iam::xxxxxxxxx:role/graviton-construct-bluepr-gravitonconstructbluepri-1OZNO42GH3OCB
```

Let's verify the resources created from the steps above.

```sh
kubectl get nodes -o json | jq -r '.items[] | "Name: ",.metadata.name,"\nInstance Type: ",.metadata.labels."beta.kubernetes.io/instance-type","\nArch: ",.metadata.labels."beta.kubernetes.io/arch","\n"' # Output shows node on M famGraviton3 processor and ARM architecture
```

## Cleanup

To clean up your EKS Blueprint, run the following command:

```sh
make pattern graviton destroy
```
