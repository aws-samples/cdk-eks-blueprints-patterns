# EKS Blueprints Patterns

Welcome to the `EKS Blueprints Patterns` repository.

This repository contains a number of samples for how you can leverage the [Amazon EKS Blueprints](https://github.com/aws-quickstart/cdk-eks-blueprints). You can think of the patterns as "codified" reference architectures, which can be explained and executed as code in the customer environment.

## Patterns

The individual patterns can be found in the `lib` directory.  Most of the patterns are self-explanatory, for some more complex examples please use this guide and docs/patterns directory for more information.

## Documentation

Please refer to the Amazon EKS Blueprints Quick Start [documentation site](https://aws-quickstart.github.io/cdk-eks-blueprints/) for complete project documentation.

## Usage
Before proceeding, make sure [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) is installed on your machine.

To use the eks-blueprints and patterns module, you must have [Node.js](https://nodejs.org/en/) and [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) installed. You will also use `make` to simplify build and other common actions. 

### Mac Setup:

Follow the below steps to setup and leverage `eks-blueprints` and `eks-blueprints-patterns` in your local Mac laptop.

1. Install `make` and `node` using brew

```
brew install make
brew install node
```

2. Install `npm`

```
sudo npm install -g n
sudo n stable
```

3. Make sure the following pre-requisites are met:

- Node version is a current stable node version 18.x.

```bash
$ node -v
v18.12.1
```

Update (provided Node version manager is installed): `n stable`. May require `sudo`.

-  NPM version must be 8.4 or above:

```bash
$ npm -v
8.19.2
```

Updating npm: `sudo n stable` where stable can also be a specific version above 8.4. May require `sudo`.

4. Clone the `eks-blueprints-patterns` repository

```
git clone https://github.com/aws-samples/cdk-eks-blueprints-patterns.git
``` 

PS: If you are contributing to this repo, please make sure to fork the repo, add your changes and create a PR against it.

5. Once you have cloned the repo, you can open it using your favourite IDE and run the below commands to install the dependencies and build the existing patterns.

- Install project dependencies.

```
make deps
```

- To view patterns that are available to be deployed, execute the following:

```
npm i
make build
```

- To list the existing CDK EKS Blueprints patterns

```
make list
```

Note: Some patterns have a hard dependency on AWS Secrets (for example GitHub access tokens). Initially you will see errors complaining about lack of the required secrets. It is normal. At the bottom, it will show the list of patterns which can be deployed, in case the pattern you are looking for is not available, it is due to the hard dependency which can be fixed by following the docs specific to those patterns.

```
To work with patterns use: 
        $ make pattern <pattern-name> <list | deploy | synth | destroy>
Example:
        $ make pattern fargate deploy 

Patterns: 

        bottlerocket
        data-at-rest
        datadog
        dynatrace-operator
        ecr-image-scanning
        emr
        fargate
        generic-cluster-provider
        guardduty
        jupyterhub
        kasten
        keptn-control-plane
        kubecost
        kubeflow
        multi-region
        multi-team
        newrelic
        nginx
        pipeline-multienv-gitops
        pipeline-multienv-monitoring
        pipeline
        rafay
        secure-ingress-cognito
        snyk
        starter
```

- Bootstrap your CDK environment.

```
npx cdk bootstrap
```

- You can then deploy a specific pattern with the following:

```
make pattern multi-team deploy
```

# Developer Flow

All files are compiled to the dist folder including `lib` and `bin` directories. For iterative development (e.g. if you make a change to any of the patterns) make sure to run compile:

```bash
make compile
```

The `compile` command is optimized to build only modified files and is fast. 

**NOTE:** Run `make compile` after EACH modification, or alternatively run `npm run watch` to watch changes. 

# Deploying Blueprints with External Dependency on AWS Resources

There are cases when the blueprints defined in the patterns have dependencies on existing AWS Resources such as Secrets defined in the account/region.
For such cases, you may see errors if such resources are not defined.

For [`PipelineMultiEnvGitops`](./lib/pipeline-multi-env-gitops/index.ts) please see instructions in this [README](./docs/patterns/pipeline-multi-env-gitops.md).

For `MultiRegionConstruct` the pattern relies on the following secrets defined:

1. `github-ssh-key` - must contain GitHub SSH private key as a JSON structure containing fields `sshPrivateKey` and `url`. The secret is expected to be defined in `us-east-1` and replicated to `us-east-2` and `us-west-2` regions. For more information on SSH credentials setup see [ArgoCD Secrets Support](https://aws-quickstart.github.io/cdk-eks-blueprints/addons/argo-cd/#secrets-support).
Example Structure:

````
{
    "sshPrivateKey": "-----BEGIN THIS IS NOT A REAL PRIVATE KEY-----\nb3BlbnNzaC1rtdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAACFwAAAAdzc2gtcn\nNhAAAAAwEAAQAAAgEAy82zTTDStK+s0dnaYzE7vLSAcwsiHM8gN\nhq2p5TfcjCcYUWetyu6e/xx5Rh+AwbVvDV5h9QyMw4NJobwuj5PBnhkc3QfwJAO5wOnl7R\nGbehIleWWZLs9qq`DufViQsa0fDwP6JCrqD14aIozg6sJ0Oqi7vQkV+jR0ht/\nuFO1ANXBn2ih0ZpXeHSbPDLeZQjlOBrbGytnCbdvLtfGEsV0WO2oIieWVXJj/zzpKuMmrr\nebPsfwr36nLprOQV6IhDDo\n-----END NOT A REAL PRIVATE KEY-----\n",

    "url": "git@github"
}
````

Note: You can notice explicit \n characters in the sshPrivateKey.

2. `argo-admin-secret` - must contain ArgoCD admin password in Plain Text. The secret is expected to be defined in `us-east-1` and replicated to `us-east-1` and `us-west-2` regions.

For ``Dynatrace One Agent`

- `dynatrace-tokens` - must contain [API_URL](https://github.com/dynatrace-oss/dynatrace-ssp-addon#aws-secret-manager-secrets), [API_TOKEN](https://github.com/dynatrace-oss/dynatrace-eks-blueprints-addon#aws-secret-manager-secrets) and [PAAS_TOKEN](https://github.com/dynatrace-oss/dynatrace-eks-blueprints-addon#aws-secret-manager-secrets) in Plain Text. The secret is expected to be defined in the target region (either directly or through AWS Secrets Manager Replication).

For `keptn-control-plane` the pattern relies on the following secrets defined:

- `keptn-secrets` - must contain API_TOKEN and BRIDGE_PASSWORD password in Plain Text. The secret is expected to be defined in `us-east-1` region.

For `newrelic` the pattern relies on the following secrets defined:

- `newrelic-pixie-keys` - must contain New Relic (required) and Pixie keys (optional). The secret is expected to be defined in the target region (either directly or through AWS Secrets Manager Replication).

For more information on defining secrets for ArgoCD, please refer to [Blueprints Documentation](https://aws-quickstart.github.io/cdk-eks-blueprints/addons/argo-cd/#secrets-support) as well as [known issues](https://aws-quickstart.github.io/cdk-eks-blueprints/addons/argo-cd/#known-issues).

For `nginx`  please see [NGINX Blueprint documentation](docs/patterns/nginx.md).

For `datadog` the pattern relies on the following secret defined:

- `apiKeyAWSSecret` - must contain the Datadog API key in Plain Text named `datadog-api-key`. The secret is expected to be defined in the target region.

For `kubeflow` please see [Kubeflow documentation](docs/patterns/kubeflow.md).

For `secure-ingress-cognito`  please see [Secure Ingress using Cognito Blueprint documentation](docs/patterns/secureingresscognito.md).

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
