# Pipeline Multi Environment Pattern

## Objective

1. Deploying an EKS cluster across 3 environments( dev, test, and prod ), with a Continuous Deployment pipeline triggered upon a commit to the repository that holds the pipeline configuration.
2. Configuring GitOps tooling (ArgoCD addon) to support multi-team and multi-repositories configuration, in a way that restricts each application to be deployed only into the team namespace, by using ArgoCD projects

## Approach

When setting a pipeline to perform Continuous Deployment for the blueprint configuration, the CDK application needs to synthesize only the relevant construct. The reason for this is because the AWS CDK Piplines construct that is used by the EKS Blueprints solution, will apply all the stacks within the CDK application that is defined in the git repository. Therefore, under the `./bin/` folder, there is another file called `main-pipeline-multi-env.ts`. This file includes only one construct which is the `PipelineMngClusterAutoscalerConstruct`. Before deploying the pipeline stack that will create the pipeline that will deploy all of the environments (dev, test, and prod), you should change the CDK Application configuration to point to the `main-pipeline-multi-env.ts` file. To do that, you will need to edit the `cdk.json` file and copy the following content into it (overriding what's already in it):

```json
{
    "app": "npx ts-node bin/main-pipeline-multi-env-gitops.ts",
    "context": {}
}
```

The blueprint uses Managed-nodegroups cluster provider with Cluster-Autoscaler addon, but any other type of compute capacity can work in this case.

### GitOps confguration

For GitOps, the blueprint bootstrap the ArgoCD addon and points to the [EKS Blueprints Workload](https://github.com/tsahiduek/eks-blueprints-workloads) sample repository.
The pattern uses the ECSDEMO applications as sample applications to demonstrate how to setup a GitOps configuration with multiple teams and multiple applications. The pattern include the following configurations in terms io:

1. Application team - it defines 3 application teams that corresponds with the 3 sample applications used
2. ArgoCD bootstrap - the pattern configure the ArgoCD addon to point to the [workload repository](https://github.com/aws-samples/eks-blueprints-workloads) of the EKS Blueprints samples
3. ArgoCD projects - as part of the ArgoCD addon bootstrap, the pattern generate an ArgoCD project for each application team. The ArgoCD are used in order to restrict the deployment of an application to a specific target namespace

You can find the App of Apps configuration for this pattern in the workload repository under the folder [`multi-repo`](https://github.com/aws-samples/eks-blueprints-workloads/tree/main/multi-repo).

## Prerequisites

1. Fork this repository to your account
2. Update the [`cdk.json`](../../cdk.json) file to point to the [main-pipeline-multi-env-gitops](../../bin/main-pipeline-multi-env-gitops.ts) according to the instructions above.  
Commit and push your changes.
3. `github-ssh-key` - must contain GitHub SSH private key as a JSON structure containing fields `sshPrivateKey` and `url`. This will be used by ArgoCD addon to authenticate against ay GitHub repository (private or public). The secret is expected to be defined in the region where the pipeline will be deployed to. For more information on SSH credentials setup see [ArgoCD Secrets Support](https://aws-quickstart.github.io/cdk-eks-blueprints/addons/argo-cd/#secrets-support).

4. `github-token` secret must be stored in AWS Secrets Manager for the GitHub pipeline. For more information on how to set it up, please refer to the [docs](https://docs.aws.amazon.com/codepipeline/latest/userguide/GitHub-create-personal-token-CLI.html). The GitHub Personal Access Token should have these scopes:
   1. *repo* - to read the repository
   2. *admin:repo_hook* - if you plan to use webhooks (enabled by default)
5. Create the relevant users that will be used by the different teams

    ```bash
    aws iam create-user --user-name frontend-user
    aws iam create-user --user-name nodejs-user
    aws iam create-user --user-name crystal-user
    aws iam create-user --user-name platform-user
    ```

6. Install project dependencies by running `npm install` in the main folder of this cloned repository

## Deploying

Once all pre-requisites are set you are ready to deploy the pipeline. Run the following command from the root of this repository to deploy the pipeline stack:

```bash
npx cdk deploy
```
