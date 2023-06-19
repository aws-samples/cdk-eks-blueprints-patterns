# Pipeline Multi Environment Pattern

## Objective

1. Deploying an EKS cluster across 3 environments( dev, test, and prod ), with a Continuous Deployment pipeline triggered upon a commit to the repository that holds the pipeline configuration.
2. Configuring GitOps tooling (ArgoCD addon) to support multi-team and multi-repositories configuration, in a way that restricts each application to be deployed only into the team namespace, by using ArgoCD projects

### GitOps confguration

For GitOps, the blueprint bootstrap the ArgoCD addon and points to the [EKS Blueprints Workload](https://github.com/aws-samples/eks-blueprints-workloads) sample repository.
The pattern uses the ECSDEMO applications as sample applications to demonstrate how to setup a GitOps configuration with multiple teams and multiple applications. The pattern include the following configurations in terms io:

1. Application team - it defines 3 application teams that corresponds with the 3 sample applications used
2. ArgoCD bootstrap - the pattern configure the ArgoCD addon to point to the [workload repository](https://github.com/aws-samples/eks-blueprints-workloads) of the EKS Blueprints samples
3. ArgoCD projects - as part of the ArgoCD addon bootstrap, the pattern generate an ArgoCD project for each application team. The ArgoCD are used in order to restrict the deployment of an application to a specific target namespace

You can find the App of Apps configuration for this pattern in the workload repository under the folder [`multi-repo`](https://github.com/aws-samples/eks-blueprints-workloads/tree/main/multi-repo).

## Prerequisites

1. Fork this repository to your GitHub organisation/user
2. Clone your forked repository
3. Install the AWS CDK Toolkit globally on your machine using

    ```bash
    npm install -g aws-cdk
    ```

4. `github-ssh-key` - must contain GitHub SSH private key as a JSON structure containing fields `sshPrivateKey` and `url`. This will be used by ArgoCD addon to authenticate against ay GitHub repository (private or public). The secret is expected to be defined in the region where the pipeline will be deployed to. For more information on SSH credentials setup see [ArgoCD Secrets Support](https://aws-quickstart.github.io/cdk-eks-blueprints/addons/argo-cd/#secrets-support).

5. `github-token` secret must be stored in AWS Secrets Manager for the GitHub pipeline. For more information on how to set it up, please refer to the [docs](https://docs.aws.amazon.com/codepipeline/latest/userguide/GitHub-create-personal-token-CLI.html). The GitHub Personal Access Token should have these scopes:
   1. *repo* - to read the repository
   2. *admin:repo_hook* - if you plan to use webhooks (enabled by default)

6. Create the relevant users that will be used by the different teams

    ```bash
    aws iam create-user --user-name frontend-user
    aws iam create-user --user-name nodejs-user
    aws iam create-user --user-name crystal-user
    aws iam create-user --user-name platform-user
    ```

7. Install project dependencies by running `npm install` in the main folder of this cloned repository

8. In case you haven't done this before, bootstrap your AWS Account for AWS CDK use using:

    ```bash
    cdk bootstrap
    ```

9. Modify the code in your forked repo to point to your GitHub username/organisation. This is needed because the AWS CodePipeline that will be automatically created will be triggered upon commits that are made in your forked repo. Open the [pattenrn file source code](../../lib/pipeline-multi-env-gitops/index.ts) and look for the declared const of `gitOwner`. Change it to your GitHub username.

10. *OPTIONAL* - As mentioned above, this pattern uses another repository for GitOps. This is the ArgoCD App of Apps configuration that resides in the [aws-samples](https://github.com/aws-samples/eks-blueprints-workloads/tree/main/multi-repo) organisation. If you would like to modify the App of Apps configuration and customise it to your needs, then use the following instructions:

    1. Fork the [App of Apps](https://github.com/aws-samples/eks-blueprints-workloads/tree/main/multi-repo) workloads repo to your GitHub username

    2. Modify the [pattern code](../../lib/pipeline-multi-env-gitops/index.ts) with the following changes:

       1. Change the consts of `devArgoAddonConfig`, `testArgoAddonConfig`, and `prodArgoAddonConfig` to point to your GitHub username

       2. In the `createArgoAddonConfig` function, look for the `git@github.com:aws-samples/eks-blueprints-workloads.git` code under the `sourceRepos` configurations, and add another reference to your forked workload repository

## Deploying

Once all pre-requisites are set you are ready to deploy the pipeline. Run the following command from the root of this repository to deploy the pipeline stack:

```bash
make pattern pipeline-multienv-gitops deploy eks-blueprint-pipeline-stack
```

Now you can go to [AWS CodePipeline console](https://eu-west-1.console.aws.amazon.com/codesuite/codepipeline/pipelines), and see how it was automatically created to deploy multiple Amazon EKS clusters to different environments.

### Notes

1. In case your pipeline fails on the first run, it's because that the AWS CodeBuild step needs elevated permissions at build time. This is described in the official [docs](https://aws-quickstart.github.io/cdk-eks-blueprints/pipelines/#troubleshooting). To resolve this, locate `AccessDeniedException` in the CodeBuild build logs, and attach the following inline policy to it:

    ```json
    {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "VisualEditor0",
                "Effect": "Allow",
                "Action": [
                    "sts:AssumeRole",
                    "secretsmanager:GetSecretValue",
                    "secretsmanager:DescribeSecret",
                    "cloudformation:*"
                ],
                "Resource": "*"
            }
        ]
    }
    ```

The above inconvenience has been fixed in the Blueprints framework as well as in the pattern, so please report such cases if you encounter them. This item is left here for reference in case customers modify the pattern to require additional permissions at build time. 

2. This pattern consumes multiple Elastic IP addresses, because 3 VPCs with 3 subnets are created by this pattern. Make sure your account limit for EIP are increased to support additional 9 EIPs (1 per Subnets)
