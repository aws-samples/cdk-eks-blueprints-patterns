# Backstage on EKS

## Objective

[Backstage](https://backstage.io/) is an application that aims to facilitate introduction and maintenance of standards and best practices, across the organization, tying all infrastructure tooling, resources, owners, contributors, and administrators together in one place.

The base functionality is provided by the Core component, which is assembled together with Plugins into an Application. Plugins extend the Core with additional functionalities that can be open source, or proprietary to a company.

The objective of this pattern is to illustrate how to deploy a Backstage pre-built Docker image, using the [Amazon EKS Blueprints Backstage add-on](https://github.com/aws-quickstart/cdk-eks-blueprints/blob/main/docs/addons/backstage.md).

## Architecture

<img src="./images/backstage-diagram.png" width="720">

## Approach

This blueprint will include the following:

- A new Well-Architected VPC with both Public and Private subnets
- A new Well-Architected EKS cluster in the region and account you specify
- An Application Load Balancer (ALB), implementing the Backstage Ingress rules
- An Amazon RDS for PostgreSQL instance
- A certificate, assigned to the ALB
- A Secret in AWS Secrets Manager, storing the database credentials, imported into the cluster via [ExternalsSecretsAddOn](https://aws-quickstart.github.io/cdk-eks-blueprints/addons/external-secrets/)
- Other popular add-ons

## Prerequisites

Ensure that you have installed the following tools on your machine:

- [aws cli](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)
- [cdk](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html#getting_started_install)
- [npm](https://docs.npmjs.com/cli/v8/commands/npm-install)
- [tsc](https://www.typescriptlang.org/download)
- [make](https://www.gnu.org/software/make/)
- [Docker](https://docs.docker.com/get-docker/)

Create the [Backstage application](https://backstage.io/docs/getting-started/create-an-app), command reported here for your convenience:

```sh
npx @backstage/create-app@latest
```

Build the corresponding [Docker image](https://backstage.io/docs/deployment/docker), commands reported here for your convenience:

```sh
yarn install --frozen-lockfile
yarn tsc
yarn build:backend --config app-config.yaml
docker image build . -f packages/backend/Dockerfile --tag backstage
```

Note: consider the platform you are building on, and the target platform the image will run on, you might want to use the [--platform option](https://docs.docker.com/engine/reference/commandline/buildx_build/), e.g.:

```sh
docker buildx build ... --platform=...
```

Note: you might need to enable BuildKit manually with:

```sh
DOCKER_BUILDKIT=1 docker image build . -f packages/backend/Dockerfile --tag backstage
```

(Optional) to show examples on the UI, add to Docker file:

```sh
COPY --chown=node:node examples /examples
```

Create an Amazon Elastic Container Registry (ECR) registry and repository

```sh
aws ecr get-login-password --region {region} | docker login --username AWS --password-stdin {account}.dkr.ecr.{region}.amazonaws.com
docker tag {the new image id here} {account}.dkr.ecr.{region}.amazonaws.com/{repository}:latest
docker push {account}.dkr.ecr.{region}.amazonaws.com/{repository}:latest
```

Setup a Hosted Zone in Route 53, with your parent domain (the pattern will create a new subdomain with format _{backstageLabel}.{parent domain}_).

## Deployment

Clone the repository:

```sh
git clone https://github.com/aws-samples/cdk-eks-blueprints-patterns.git
```

[Set the CDK_DEFAULT_ACCOUNT and CDK_DEFAULT_REGION environment variables](https://docs.aws.amazon.com/cdk/v2/guide/environments.html), in your AWS profile of the AWS CDK CLI.

The other pattern's parameters are expected to be specified in the CDK context. You can do so by editing the `{root of repository}/cdk.json` file as follows:

```
    "context": {
        "backstage.namespace.name": ...,
        "backstage.image.registry.name": ...,
        "backstage.image.repository.name": ...,
        "backstage.image.tag.name": ...,
        "backstage.parent.domain.name": ...,
        "backstage.subdomain.label": ...,
        "backstage.hosted.zone.id": ...,
        "backstage.certificate.resource.name": ...,
        "backstage.database.resource.name": ...,
        "backstage.database.instance.port": ...,
        "backstage.database.secret.resource.name": ...,
        "backstage.database.username": ...,
        "backstage.database.secret.target.name": ...,
      }
```

Assign values to the above keys according to the following criteria (values are required where you don't see _default_ mentioned):

- "backstage.namespace.name": Backstage's namespace, the default is "backstage"
- "backstage.image.registry.name": the image registry for the Backstage Helm chart in Amazon ECR, a value similar to "youraccount.dkr.ecr.yourregion.amazonaws.com"
- "backstage.image.repository.name": the image repository for the Backstage Helm chart, the default is "backstage"
- "backstage.image.tag.name": the image tag, the default is "latest"
- "backstage.parent.domain.name": the parent domain in your Hosted Zone
- "backstage.subdomain.label": to be used as _{"subdomain.label"}.{"parent.domain.name"}_, the default is "backstage"
- "backstage.hosted.zone.id": the Hosted zone ID (format: 20x chars/numbers)
- "backstage.certificate.resource.name": resource name of the certificate, registered by the resource provider, the default is "backstage-certificate"
- "backstage.database.resource.name": resource name of the database, registered by the resource provider, the default is "backstage-database"
- "backstage.database.instance.port": the port the database will use, the default is 5432
- "backstage.database.secret.resource.name": resource name of the database's Secret, registered by the resource provider, the default is "backstage-database-credentials"
- "backstage.database.username": the username for the database's credentials, the default is "postgres"
- "backstage.database.secret.target.name": the name to be used when creating the Secret, the default is "backstage-database-secret"

Run the following commands:

```sh
make deps
npm i
make build
make pattern backstage deploy
```

Navigate to _{"subdomain.label"}.{"parent.domain.name"}_, you should see the screen below:

<img src="./images/backstage-screen.png" width="720">

## Cleanup

To clean up your EKS Blueprints, run the following commands:

```sh
make pattern backstage destroy 
```
