# Backstage on EKS

## Architecture

<img src="./images/backstage-diagram.png" width="720">

## Setup

Create the [Backstage application](https://backstage.io/docs/getting-started/create-an-app).

Build the corresponding [Docker image](https://backstage.io/docs/deployment/docker). Note: consider the platform you are building on, and the target platform the image will run on, you might want to use the [--platform option](https://docs.docker.com/engine/reference/commandline/buildx_build/), e.g.:

```
docker buildx build ... --platform=...
```

(Optional) to show examples on the UI, add to Docker file:

```
COPY --chown=node:node examples /examples
```

Create an Amazon Elastic Container Registry (ECR) registry and repository

```console
aws ecr get-login-password --region {region} | docker login --username AWS --password-stdin {account}.dkr.ecr.{region}.amazonaws.com
docker tag {the new image id here} {account}.dkr.ecr.{region}.amazonaws.com/{repository}:latest
docker push {account}.dkr.ecr.{region}.amazonaws.com/{repository}:latest
```

Setup a Hosted Zone in Route 53, with your parent domain (the pattern will create a new subdomain with format _{backstageLabel}.{parent domain}_).

[Set the CDK_DEFAULT_ACCOUNT and CDK_DEFAULT_REGION environment variables](https://docs.aws.amazon.com/cdk/v2/guide/environments.html), in your AWS profile of the AWS CDK CLI.

The other pattern's parameters are expected to be specified in the CDK context. You can do so by editing the `{root of repository}/cdk.json` file as follows:

```
    "context": {
        "namespace.name": ...,
        "image.registry.name": ...,
        "image.repository.name": ...,
        "image.tag.name": ...,
        "parent.domain.name": ...,
        "subdomain.label": ...,
        "hosted.zone.id": ...,
        "certificate.resource.name": ...,
        "database.resource.name": ...,
        "database.instance.port": ...,
        "database.secret.resource.name": ...,
        "database.username": ...,
        "database.secret.target.name": ...,
      }
```

Assign values to the above keys according to the follwing criteria (values are required where you don't see _default_ mentioned):

- "namespace.name": Backstage's namespace, the default is "backstage"
- "image.registry.name": the image registry for the Backstage Helm chart in Amazon ECR, a value similar to "youraccount.dkr.ecr.yourregion.amazonaws.com"
- image.repository.name: the image repository for the Backstage Helm chart, the default is "backstage"
- "image.tag.name": the image tag, the default is "latest"
- "parent.domain.name": the parent domain in your Hosted Zone
- "subdomain.label": to be used as _{"subdomain.label"}.{"parent.domain.name"}_, the default is "backstage"
- "hosted.zone.id": the Hosted zone ID (format: 20x chars/numbers)
- "certificate.resource.name": resource name of the certificate, registered by the resource provider, the default is "backstage-certificate"
- "database.resource.name": resource name of the database, registered by the resource provider, the default is "backstage-database"
- "database.instance.port": the port the database will use, the default is 5432
- "database.secret.resource.name": resource name of the database's Secret, registered by the resource provider, the default is "backstage-database-credentials"
- "database.username": the username for the database's credentials, the default is "postgres"
- "database.secret.target.name": the name to be used when creating the Secret, the default is "backstage-database-secret"

## Deployment

Follow the deployment instructions detailed in the main README file of this repository, using _backstage_ as the name of the pattern.
