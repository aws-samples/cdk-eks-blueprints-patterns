# Karpenter on EKS

Karpenter add-on is based on the [Karpenter](https://github.com/aws/karpenter) open source node provisioning project. It provides a more efficient and cost-effective way to manage workloads by launching just the right compute resources to handle a cluster's application.

Karpenter works by:

- Watching for pods that the Kubernetes scheduler has marked as unschedulable,
- Evaluating scheduling constraints (resource requests, nodeselectors, affinities, tolerations, and topology spread constraints) requested by the pods,
- Provisioning nodes that meet the requirements of the pods,
- Scheduling the pods to run on the new nodes, and
- Removing the nodes when the nodes are no longer needed

To learn more about Karpenter add on usage, please visit the documentation [here](https://aws-quickstart.github.io/cdk-eks-blueprints/addons/karpenter/)
This pattern deploys the following resources:

- Creates EKS Cluster Control plane with public endpoint (for demo purpose only) with a managed node group
- Deploys supporting add-ons: AwsLoadBalancerController, VpcCni, CoreDns, KubeProxy,  CertManagerAddOn, KubeStateMetricsAddOn, MetricsServer
- Deploy Karpenter on the EKS cluster

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

To view patterns and deploy karpenter pattern

```sh
make list
npx cdk bootstrap
make pattern karpenter deploy
```

## Verify the resources

Run the update-kubeconfig command. You should be able to get the command from the CDK output message. More information can be found at https://aws-quickstart.github.io/cdk-eks-blueprints/getting-started/#cluster-access

```sh
aws eks update-kubeconfig --name karpenter-blueprint --region <your region> --role-arn arn:aws:iam::xxxxxxxxx:role/karpenter-construct-bluepr-karpenterconstructbluepri-1OZNO42GH3OCB
```

Let's verify the resources created from the steps above.

```bash
# Assuming add-on is installed in the karpenter namespace.
$ kubectl get po -n karpenter
NAME                                          READY   STATUS    RESTARTS   AGE
karpenter-54fd978b89-hclmp   2/2     Running   0          99m
```

###  Testing with a sample deployment

Now that the provisioner is deployed, Karpenter is active and ready to provision nodes. Create some pods using a deployment:

```bash
cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: inflate
spec:
  replicas: 0
  selector:
    matchLabels:
      app: inflate
  template:
    metadata:
      labels:
        app: inflate
    spec:
      terminationGracePeriodSeconds: 0
      containers:
        - name: inflate
          image: public.ecr.aws/eks-distro/kubernetes/pause:3.2
          resources:
            requests:
              cpu: 1
EOF
```

Now scale the deployment:

```bash
kubectl scale deployment inflate --replicas 10
```

The provisioner will then start deploying more nodes to deploy the scaled replicas. You can verify by either looking at the karpenter controller logs,

```bash
kubectl logs -f -n karpenter karpenter-54fd978b89-hclmp
```

or, by looking at the nodes being created:

```bash
kubectl get nodes
```

