# Pipeline Multi Environment Pattern

## Objective

1. Deploying an EKS cluster across 3 environments( dev, tes, and prod ), with a Continuous Deployment pipeline triggered upon a commit to the repository that holds the pipeline configuration.
2. Configuring GitOps tooling (ArgoCD addon) to support multi-team and multi-repositories configuration, in a way that restrict each application to be deployed only into the team namespace, by using ArgoCD projects

## Approach

When setting a pipeline to perform Continuous Deployment for the blueprint configuration, the CDK application needs to synthesis only the relevant construct. The reason for this is because the AWS CDK Piplines construct that is used by the EKS Blueprints solution, will apply all the stacks within the CDK application that is defined in the git repository. Therefore, under the `./bin/` folder, there is another file called `main-pipeline-multi-env.ts`. This file includes only one construct which is the `PipelineMngClusterAutoscalerConstruct`. Before deploying the pipeline stack that will create the pipeline that will deploy all of the environments (dev, test, and prod), you should change the CDK Application configuration to point to the `main-pipeline-multi-env.ts` file. To do that, you need to edit the `cdk.json` file and copy the following content into it (overriding what's already in it):

```json
{
    "app": "npx ts-node bin/main-pipeline-multi-env-gitops.ts",
    "context": {}
}
```

The blueprint uses Managed-nodegroups cluster provider with Cluster-Autoscaler addon, but any other type of compute capacity can work in this case

## Prerequisites

1. `argo-admin-password` secret must be defined as plain text (not key/value) in `us-west-2`  region.
2. `github-ssh-key` - must contain GitHub SSH private key as a JSON structure containing fields `sshPrivateKey` and `url`. The secret is expected to be defined in the region where the pipeline will be deployed to. For more information on SSH credentials setup see [ArgoCD Secrets Support](https://aws-quickstart.github.io/cdk-eks-blueprints/addons/argo-cd/#secrets-support).

## Deploying

Once all pre-requisites are set you should be able to get a working cluster with all the objectives met.
