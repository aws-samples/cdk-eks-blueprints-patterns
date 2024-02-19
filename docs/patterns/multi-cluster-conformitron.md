# Multi Cluster Conformitron Testing

## Objective

1. Creating a pipeline to deploy 8 EKS cluster in a region, with a Continuous Deployment  triggered upon a commit to the repository that holds the pipeline configuration.

1. Configure the clusters with different architectures (x86 and arm) and different Kuberentes versions and use fluxCD pipeline to deploy all the available [EKS Anywhere Addons](https://github.com/aws-samples/eks-anywhere-addons).

### GitOps confguration

For GitOps, the FluxCD repository points to the [EKS Anywhere Addons](https://github.com/aws-samples/eks-anywhere-addons) repository.
The addons may require some additional secrets to be created for the addons to function properly

1. Application team - it defines 3 application teams that corresponds with the 3 sample applications used
1. ArgoCD bootstrap - the pattern configure the ArgoCD addon to point to the [workload repository](https://github.com/aws-samples/eks-blueprints-workloads) of the EKS Blueprints samples
3. ArgoCD projects - as part of the ArgoCD addon bootstrap, the pattern generate an ArgoCD project for each application team. The ArgoCD are used in order to restrict the deployment of an application to a specific target namespace

You can find the App of Apps configuration for this pattern in the workload repository under the folder [`multi-repo`](https://github.com/aws-samples/eks-blueprints-workloads/tree/main/multi-repo).

## Prerequisites

1. Fork this repository to your GitHub organisation/user
2. Clone your forked repository
3. Install the AWS CDK Toolkit globally on your machine using

    ```bash
    npm install -g aws-cdk
    ```

1. `github-ssh-key` - must contain GitHub SSH private key as a JSON structure containing fields `sshPrivateKey` and `url`. This will be used by ArgoCD addon to authenticate against ay GitHub repository (private or public). The secret is expected to be defined in the region where the pipeline will be deployed to. For more information on SSH credentials setup see [ArgoCD Secrets Support](https://aws-quickstart.github.io/cdk-eks-blueprints/addons/argo-cd/#secrets-support).

1. `github-token` secret must be stored in AWS Secrets Manager for the GitHub pipeline. For more information on how to set it up, please refer to the [docs](https://docs.aws.amazon.com/codepipeline/latest/userguide/GitHub-create-personal-token-CLI.html). The GitHub Personal Access Token should have these scopes:
   1. *repo* - to read the repository
   1. *admin:repo_hook* - if you plan to use webhooks (enabled by default)

1. Increase service quota for required resources
```
   SERVICE                                   | QUOTA NAME                         | REQUESTED QUOTA
   Amazon Virtual Private Cloud (Amazon VPC) | NAT gateways per Availability Zone | 30 
   Amazon Virtual Private Cloud (Amazon VPC) | VPCs per region                    | 30
   Amazon Elastic Compute Cloud (Amazon EC2) | EC2-VPC Elastic IPs                | 30
```

1. Amazon Managed Grafana workspace: To visualize metrics collected, you need an Amazon Managed Grafana workspace. If you have an existing workspace, create an environment variable as described below. To create a new workspace, visit [our supporting example for Grafana](https://aws-observability.github.io/terraform-aws-observability-accelerator/helpers/managed-grafana/)

```bash
export AMG_ENDPOINT_URL=https://g-xyz.grafana-workspace.us-east-1.amazonaws.com
```

1. In case you haven't done this before, bootstrap your AWS Account for AWS CDK use using:

    ```bash
    cdk bootstrap
    ```

1. Modify the code in your forked repo to point to your GitHub username/organisation. This is needed because the AWS CodePipeline that will be automatically created will be triggered upon commits that are made in your forked repo. Open the [pattenrn file source code](../../lib/multi-cluster-construct/pipeline.ts) and look for the declared const of `gitOwner`. Change it to your GitHub username.


## Deploying

Once all pre-requisites are set you are ready to deploy the pipeline. Run the following command from the root of this repository to deploy the pipeline stack:

```bash
make pattern multi-cluster-conformitron deploy multi-cluster-central-pipeline
```

Now you can go to [AWS CodePipeline console](https://eu-west-1.console.aws.amazon.com/codesuite/codepipeline/pipelines), and see how it was automatically created to deploy multiple Amazon EKS clusters to different environments.
