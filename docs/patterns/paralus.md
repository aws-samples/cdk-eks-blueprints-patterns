# Paralus on EKS
The Paralus project is a free, open source tool that enables controlled, audited access to Kubernetes infrastructure. It comes with just-in-time service account creation and user-level credential management that integrates with your RBAC and SSO. 

This pattern deploys the following resources:

- Creates EKS Cluster Control plane with public endpoint (for demo purpose only) with a managed node group
- Deploys supporting add-ons:  AwsLoadBalancerController, VpcCni, KubeProxy, EbsCsiDriverAddOn
- Deploy Paralus on the EKS cluster


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

To view patterns and deploy paralus pattern

```sh
cdk list
cdk bootstrap
cdk deploy paralus-blueprint
```


## Verify the resources


Run update-kubeconfig command. You should be able to get the command from CDK output message. More information can be found at https://aws-quickstart.github.io/cdk-eks-blueprints/getting-started/#cluster-access
```sh
aws eks update-kubeconfig --name <your cluster name> --region <your region> --role-arn arn:aws:iam::378123694894:role/paralus-blueprint-paralusblueprintMastersRoleF3287-EI3XEBO1107B
```

Let’s verify the resources created by Steps above.
```sh
kubectl get nodes # Output shows the EKS Managed Node group nodes

kubectl get ns | grep paralus # Output shows paralus namespace

kubectl get pods --namespace=paralus-system  # Output shows paralus pods

blueprints-addon-paralus-contour-contour-7857f4cd9-kqhgp   1/1     Running                 
blueprints-addon-paralus-contour-envoy-mx8z7               2/2     Running                 
blueprints-addon-paralus-fluent-bit-525tt                  1/1     Running                 
blueprints-addon-paralus-kratos-588775bc47-wf5gf           2/2     Running                 
blueprints-addon-paralus-kratos-courier-0                  2/2     Running                 
blueprints-addon-paralus-postgresql-0                      1/1     Running                 
dashboard-6d8b54d78b-d8cks                                 1/1     Running                 
paralus-66d9bbf698-qznzl                                   2/2     Running                 
prompt-54d45cff79-h9x95                                    2/2     Running   
relay-server-79448564cb-nf5tj                              2/2     Running              
```


## Configure DNS Settings 
Once Paralus is installed continue with following steps https://www.paralus.io/blog/eks-quickstart#configuring-dns-settings to configure DNS settings, reset default password and start using paralus

## Paralus Features & Usage 
https://www.paralus.io/docs/usage/

## Cleanup

To clean up your EKS Blueprints, run the following commands:


```sh
cdk destroy paralus-blueprint 

```

## Troubleshooting
If postgres pvc is not getting a volume allocated, it probably is due to the iam permissions. Please refer this https://docs.aws.amazon.com/eks/latest/userguide/csi-iam-role.html to assign approriate policies to kubernetes sa

## Disclaimer 
This pattern relies on an open source NPM package paralus-eks-blueprints-addon. Please refer to the package npm site for more information.
https://www.npmjs.com/package/@paralus/paralus-eks-blueprints-addon

If you have any questions about the npm package or find any defect, please post in the source repo at 
https://github.com/paralus/eks-blueprints-addon
