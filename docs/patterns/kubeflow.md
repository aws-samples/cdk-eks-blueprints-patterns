# Kubeflow on EKS
The Kubeflow project is dedicated to making deployments of machine learning (ML) workflows on Kubernetes simple, portable and scalable.
Our goal is not to recreate other services, but to provide a straightforward way to deploy best-of-breed open-source systems for ML to diverse infrastructures.
Anywhere you are running Kubernetes, you should be able to run Kubeflow.

This pattern deploys the following resources:

- Creates EKS Cluster Control plane with public endpoint (for demo purpose only) with a managed node group
- Deploys supporting add-ons: ClusterAutoScaler, AwsLoadBalancerController, VpcCni, CoreDns, KubeProxy, EbsCsiDriver, CertManagerAddOn, KubeStateMetricsAddOn, PrometheusNodeExporterAddOn, AdotCollectorAddOn, AmpAddOn,
- Deploy Kubeflow on the EKS cluster


## Prerequisites:

Ensure that you have installed the following tools on your machine.

1. [aws cli](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)
2. [kubectl](https://Kubernetes.io/docs/tasks/tools/)
3. [cdk](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html#getting_started_install)
4. [npm](https://docs.npmjs.com/cli/v8/commands/npm-install)



## Deploy EKS Cluster with Amazon EKS Blueprints for CDK

Clone the repository

```sh
git clone https://github.com/aws-samples/cdk-eks-blueprints-patterns.git
```

Updating npm

```sh
npm install -g npm@latest
```

To view patterns and deploy kubeflow pattern

```sh
make list
cdk bootstrap
make pattern kubeflow deploy
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
cdk destroy kubeflow-blueprint 

```

## Disclaimer 
This pattern relies on an open source NPM package eks-blueprints-cdk-kubeflow-ext. Please refer to the package npm site for more information.
https://www.npmjs.com/package/eks-blueprints-cdk-kubeflow-ext

If you have any questions about the npm package or find any defect, please post in the source repo at 
https://github.com/season1946/eks-blueprints-cdk-kubeflow-extension
