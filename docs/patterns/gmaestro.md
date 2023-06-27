# gMaestro on EKS pattern

gMaestro is a Kubernetes cost optimization solution that helps companies reduce spending on unutilized resources by up to 60%.
With gMaestro, you gain full visibility into K8s clusters, seamlessly interact with HPA scaling policies, and achieve your cost-performance goals by applying custom rightsizing recommendations based on actual usage in production.

This pattern deploys the following resources:
- Creates a single EKS cluster that includes a managed node group
- Deploys a single granulate-gmaestro deployment with a single pod on the EKS cluster

For additional information, visit [gMaestro documentation](https://gmaestro.gitbook.io/gmaestro-docs/).

## Prerequisite 
Before using gMaestro, you need to:
1. [Sign up](https://app.granulate.io/gMaestroSignup) to the gMaestro platform
2. Download a sample YAML file - After signing up to gMaestro, navigate to the [Deploy](https://app.granulate.io/deploy) on the left-hand menu, fill in the required fields and click on "Generate Config File" 

![GmaestroGenerateConfigFile](images/gmaestro-generate-config-file.png)

![GmaestroConfigFile](images/gmaestro-config-file.png)

3. Create a secret (as a plaintext) in AWS Secrets Manager copy its value from the following place:
   1. Deployment section `MAESTRO_CLIENT_ID`

4. Follow the usage [instructions](../../README.md#usage) to install the dependencies
   
## Deploy an EKS Cluster using Amazon EKS Blueprints for CDK

Clone the repository

```sh
git clone https://github.com/aws-samples/cdk-eks-blueprints-patterns.git
cd cdk-eks-blueprints-patterns
```

Update the patterns parameters:

- `clientIdSecretName: string` - The secret name from the prerequisite

- `clusterName: string` - Copy from the Deployment section `MAESTRO_SERVICE_NAME` value

- `createNamespace: boolean` - If you want CDK to create the namespace for you

- `namespace: string` (optional) - The namespace where gMaestro will be installed. `default` namespace is used as default.


If you haven't done it before, [bootstrap your cdk account and region](https://docs.aws.amazon.com/cdk/v2/guide/bootstrapping.html).

Run the following commands:

```sh
make deps
make build
make pattern gmaestro deploy
```

## Usage

Use the following command to validate that gMaestro installed successfully:

```bash
$ kubectl get pods -A | grep granulate-maestro

NAMESPACE     NAME                                 READY   STATUS    RESTARTS   AGE
default       granulate-maestro-6947dc87bc-k5nfc   1/1     Running   0          11m
```

After a few seconds, you will gain full visibility into your K8s cluster objects.
The first rightsizing recommendations may take up to 5 minutes to load.


## Cleanup

To clean up your EKS Blueprints, run the following commands:

```sh
cdk destroy gmaestro
```

## Security issue

1. The implementation requires access to the AWS Secrets Manager at build time to retrieve secret values.
2. The secret value will be stored as plain text in the resulting CloudFormation stack, meaning that any user with access to view CloudFormation stack can gain access to this secret.

Note: This secret is specific to gMaestro and don't affect customer account beyond the scope of the gMaestro add-on.

## Support

If you have questions about Gmaestro, catch us [on Slack](https://granulatecommunity.slack.com/archives/C03RK0HN2TU)!

## Disclaimer

This pattern relies on an open-source NPM package gmaestro-eks-blueprints-addon. Please refer to the package npm site for more information.
<https://www.npmjs.com/package/@granulate/gmaestro-eks-blueprints-addon>

If you have any questions about the npm package or find any defect, please post in the source repo at 
<https://github.com/Granulate/gmaestro-eks-blueprints-addon>
