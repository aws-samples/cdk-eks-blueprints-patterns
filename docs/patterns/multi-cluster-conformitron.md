# Multi-cluster pattern with observability cost optimizations and metrics aggregation

## Objective

1. Automate deployment of multiple EKS cluster in a region, with a Continuous Deployment pipeline triggered upon a commit to the GitHub repository that hosts the pipeline configuration.

1. Configure the EKS clusters deployed with different architectures (x86 or ARM or Bottlerocket) and different Kubernetes versions (latest and 3 most recent).

1. Enable all the available [EKS Anywhere Addons](https://github.com/aws-samples/eks-anywhere-addons), on each of the clusters, essentially testing their compatibility across all the potential architecture/version available today on AWS. 

### GitOps confguration

GitOps is a branch of DevOps that focuses on using Git code repositories to manage infrastructure and application code deployments.

There are two GitOps patterns in this deployment, first is the deployment of the EKS clusters using GitHub webhooks and AWS CodePipeline and the second is for deployment of all the EKS-A addons on the clusters using FluxCD.

We require some additional secrets to be created in Secrets Manager for the pattern to function properly

1. AWS CodePipeline Bootstrap - The AWS CodePipeline points to the GitHub clone of this repository i.e [cdk-eks-blueprint-patterns] (https://github.com/aws-samples/cdk-eks-blueprints-patterns). 

A `github-token` secret must be stored in AWS Secrets Manager for the CodePipeline to access the webhooks on GitHub. For more information on how/why to set it up, please refer to the [docs](https://docs.aws.amazon.com/codepipeline/latest/userguide/GitHub-create-personal-token-CLI.html). The GitHub Personal Access Token should have these scopes:
   1. *repo* - to read your forked ckd-blueprint-patterns repostiory
   1. *admin:repo_hook* - if you plan to use webhooks (enabled by default)

1. FluxCD Bootstrap - The FluxCD points to the [EKS Anywhere Addons](https://github.com/aws-samples/eks-anywhere-addons) repository. Since this is a public repository you will not need to add a github token to read it.

 As part of the FluxCD configuration, it uses Kustomize to apply all the addons that are in the repository along with deploying their functional tests and a custom validator cronJob.


## Prerequisites
Start by setting the account and region environment variables:

```sh
ACCOUNT_ID=$(aws sts get-caller-identity --query 'Account' --output text)
AWS_REGION=$(aws configure get region)
```
1. In case you haven't done this before, bootstrap your AWS Account for AWS CDK use using:

    ```bash
    cdk bootstrap
    ```

1. Fork this repository (cdk-eks-blueprints-patterns) to your GitHub organisation/user
1. Git clone your forked repository onto your machine
1. Install the AWS CDK Toolkit globally on your machine using

    ```bash
    npm install -g aws-cdk
    ```

1. Increase AWS service quota for required resources, navigate to [Service Quota Tutorial](https://aws.amazon.com/getting-started/hands-on/request-service-quota-increase/) to learn more
```
   SERVICE                                   | QUOTA NAME                         | REQUESTED QUOTA
   Amazon Virtual Private Cloud (Amazon VPC) | NAT gateways per Availability Zone | 30 
   Amazon Virtual Private Cloud (Amazon VPC) | VPCs per region                    | 30
   Amazon Elastic Compute Cloud (Amazon EC2) | EC2-VPC Elastic IPs                | 30
```

1. Amazon Managed Grafana Workspace: To visualize metrics collected, you need an Amazon Managed Grafana workspace. If you have an existing workspace, create an environment variable `AMG_ENDPOINT_URL` as described below. To create a new workspace, visit [our supporting example for Grafana](https://aws-observability.github.io/terraform-aws-observability-accelerator/helpers/managed-grafana/)

```bash
export AMG_ENDPOINT_URL=https://g-xxx.grafana-workspace.region.amazonaws.com
```

1. Amazon Managed Prometheus Workspace: To store observability metrics from all clusters we will use Amazon Managed Prometheus due to it's ease of setup and easy integration with other AWS services. We recommend setting up a new seperate Prometheus workspace using the commands below.

```bash
aws amp create-workspace --alias conformitron
```

Copy the `workspaceID` from the output and export it as a variable

```bash
export AMP_WS_ID=ws-xxxxxxx-xxxx-xxxx-xxxx-xxxxxx
```


1. Modify the code in your forked repo to point to your GitHub username/organisation. Open the [pattern file source code](../../lib/multi-cluster-construct/pipeline.ts) and look for the declared const of `gitOwner`. Change it to your GitHub username.


## Deploying

Clone the repository:

```sh
git clone https://github.com/aws-samples/cdk-eks-blueprints-patterns.git
cd cdk-eks-blueprints-patterns
```

Set the pattern's parameters in the CDK context by overriding the _cdk.json_ file (edit _PARENT_DOMAIN_NAME_ as it fits):
```sh
cat << EOF > cdk.json
{
    "app": "npx ts-node dist/lib/common/default-main.js",
    "context": {
        "conformitron.amp.endpoint": "https://aps-workspaces.${AWS_REGION}.amazonaws.com/workspaces/${AMP_WS_ID}/",
        "conformitron.amp.arn":"arn:aws:aps:${AWS_REGION}:${ACCOUNT_ID}:workspace/${AMP_WS_ID}",
        "conformitron.amg.endpoint": "${AMG_ENDPOINT_URL}",
        "conformitron.version": ["1.28","1.29","1.30"]
      }
}
EOF
```

You are now ready to deploy the pipeline. Run the following command from the root of this repository to deploy the pipeline stack:

```bash
make pattern multi-cluster-conformitron deploy multi-cluster-central-pipeline
```

Now you can go to [AWS CodePipeline console](https://eu-west-1.console.aws.amazon.com/codesuite/codepipeline/pipelines), and see how it was automatically created to deploy multiple Amazon EKS clusters to different environments.



# SSM Cost Optimizations for conformitron clusters

Running all the clusters for 24 hours results in a daily spend of $300+

To minimize these costs we have written a systems manager automation which automatically scales down autoscaling group to 0 desired nodes during off-business hours.

On weekdays 5 PM PST clusters are scaled to 0 -> CRON EXPRESSION:  `0 17 ? * MON-FRI *`
On weekdays 5 AM PST clusters are scaled to 1 -> CRON EXPRESSION:  `0 05 ? * MON-FRI *`
On weekends clusters stay scaled to 0.

These optimizations bring down the weekly cost to less than 1000$ essentially for a more than 60% cost savings.

Please find the SSM Automation documents `lib/multi-cluster-construct/CostOptimizationSSM/ScaleDownEKStoZero.yml` and `lib/multi-cluster-construct/CostOptimizationSSM/ScaleUpEKStoOne.yml`in this directory. They are triggered by event bridge on the con schedule specified above.