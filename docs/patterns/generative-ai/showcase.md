# Using Gen AI to run a prompt showcase with Bedrock and Amazon EKS

## Objective

[Amazon Bedrock](https://aws.amazon.com/bedrock/) is a fully managed service for using foundation models. It allows you to access models from Amazon and third parties with a single set of APIs for both text generation and image generation.

In this pattern we will demonstrate a prompt showcase with Gen AI using Bedrock and Amazon EKS. This usecase will demonstrate a prompt showcase which uses different prompt templates such as Summarization, Sentiment and Recommendation with user input to generate a response using Generative AI. In this model we will running a containerized application on Amazon EKS which integrates with Bedrock to provide required user response.

## Architecture

<img src="./images/generativeai-showcase.jpg" width="720">

## Prerequisites

Ensure that you have installed the following tools on your machine:

- [aws cli](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html) (also ensure it is [configured](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-quickstart.html#getting-started-quickstart-new))
- Bedrock is currently in preview. Please make sure your AWS account is enabled to use Bedrock
- [cdk](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html#getting_started_install)
- [npm](https://docs.npmjs.com/cli/v8/commands/npm-install)
- [tsc](https://www.typescriptlang.org/download)
- [make](https://www.gnu.org/software/make/)
- [Docker](https://docs.docker.com/get-docker/)

Let’s start by setting the account and region environment variables:

```sh
ACCOUNT_ID=$(aws sts get-caller-identity --query 'Account' --output text)
AWS_REGION=$(aws configure get region)
```

Clone the repository:

```sh
git clone https://github.com/aws-samples/cdk-eks-blueprints-patterns.git
cd cdk-eks-blueprints-patterns/lib/generative-ai/showcase/python
```
Create the ECR image repository and push the docker image to ECR for your showcase app:

```sh
aws ecr create-repository --repository-name bedrock-showcase
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
docker build -t bedrock-showcase .
docker tag bedrock-showcase:latest 288947426911.dkr.ecr.us-east-1.amazonaws.com/bedrock-showcase:v2
docker push 288947426911.dkr.ecr.us-east-1.amazonaws.com/bedrock-showcase:v2
cd ../../../../
```

## Deployment

If you haven't done it before, [bootstrap your cdk account and region](https://docs.aws.amazon.com/cdk/v2/guide/bootstrapping.html).

Run the following commands:

```sh
make deps
make build
make pattern generative-ai-showcase deploy
```
When deployment completes, the output will be similar to the following:

![Showcase deployment output](./images/showcase-console-output.png)


To see the deployed resources within the cluster, please run:

```sh
kubectl get pod,svc,secrets,ingress -A
```

A sample output is shown below:

![Showcase kubectl output](./images/showcase-kubectl-output.png)

Next, Navigate to the URL show under Ingress to see the below screen to interact with Generative AI showcase application by selecting different promptsand inputs and see the result :

![Showcase application](./images/showcase-demo-output.png)

## Next steps

You can go the [AWS Blog](https://aws.amazon.com/blogs/) to explore how to learn about [New Tools for Building with Generative AI on AWS](https://aws.amazon.com/blogs/machine-learning/announcing-new-tools-for-building-with-generative-ai-on-aws/). Also check on another blog our  on [Enabling Foundation Models to Complete Tasks With Agents for Amazon Bedrock](https://aws.amazon.com/blogs/aws/preview-enable-foundation-models-to-complete-tasks-with-agents-for-amazon-bedrock/). 

## Cleanup

To clean up your EKS Blueprints, run the following commands:

```sh
make pattern generative-ai-showcase destroy 
```
