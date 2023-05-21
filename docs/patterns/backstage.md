# Backstage on EKS

## Architecture

![Architecture](./images/backstage-diagram.png)

## Setup

Crete the [Backstage application](https://backstage.io/docs/getting-started/create-an-app).

Build the corresponding [Docker image](https://backstage.io/docs/deployment/docker).

(Optional) to show examples on the UI, add to Docker file:

```
COPY --chown=node:node examples /examples
```

Create an ECR registry and repository

```console
aws ecr get-login-password --region {region} | docker login --username AWS --password-stdin {account}.dkr.ecr.{region}.amazonaws.com
docker tag {the new image id here} {account}.dkr.ecr.{region}.amazonaws.com/{repository}:latest
docker push {account}.dkr.ecr.{region}.amazonaws.com/{repository}:latest
```

Setup a Hosted Zone in Route 53, with your parent domain (the pattern will create a new subdomain with format _{backstageLabel}.{parent domain}_).

Fill in the following parameters in the _main.ts_ file
- account: your AWS account number
- region: the region of your choice
- namespace: Backstage's namespace
- backstageImageRegistry: the image registry for the Backstage Helm chart
- backstageImageRepository: the image repository for the Backstage Helm chart
- backstageImageTag: the image tag
- parentDomain: the parent domain in your Hosted Zone
- backstageLabel: to be used in _{backstageLabel}.{parent domain}_
- hostedZoneId: the Hosted zone ID (format: 20x chars/numbers)
- certificateResourceName: resource name of the certificate, registered by the resource provider
- databaseResourceName: resource name of the database, registered by the resource provider
- databaseInstancePort: the port the database will use
- databaseSecretResourceName: resource name of the database's Secret, registered by the resource provider
- username: the username for the database's credentials,
- databaseSecretTargetName: the name to be used when creating the Secret

## Deployment

Run the command (replacing _backstageLabel_ with your set value):

````
npx cdk deploy {backstageLabel}-cluster
````