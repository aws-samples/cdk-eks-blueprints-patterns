# EKS Blueprints Patterns

Welcome to the `EKS Blueprints Patterns` repository.

This repository contains a number of samples for how you can leverage the [Amazon EKS Blueprints](https://github.com/aws-quickstart/cdk-eks-blueprints). You can think of the patterns as "codified" reference architectures, which can be explained and executed as code in the customer environment.

## Patterns

The individual patterns can be found in the `lib` directory. Most of the patterns are self-explanatory, for some more complex examples please use this guide and docs/patterns directory for more information.

## Documentation

Please refer to the Amazon EKS Blueprints Patterns [documentation site](https://aws-samples.github.io/cdk-eks-blueprints-patterns/) for complete list of Amazon EKS Blueprints patterns documentation.

Please refer to the Amazon EKS Blueprints Quick Start [documentation site](https://aws-quickstart.github.io/cdk-eks-blueprints/) for complete project documentation.

## Usage

Before proceeding, make sure [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) is installed on your machine.

To use the eks-blueprints and patterns module, you must have [Node.js](https://nodejs.org/en/) and [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) installed. You will also use `make` and `brew` to simplify build and other common actions.

### RHEL Setup

Follow the below steps to setup and leverage `eks-blueprints` and `eks-blueprints-patterns` in your Amazon Linux/CentOS/RHEL Linux machine.

1.  **Update the package list**

    Update the package list to ensure you're installing the latest versions.

    ```bash
    sudo yum update
    ```

1.  **Install `make`**

    ```bash
    sudo yum install make
    ```

1.  **Install `brew`** by following instructions as detailed in [docs.brew.sh](https://docs.brew.sh/Homebrew-on-Linux)

    ```bash
     /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    ```

    Add Homebrew to your PATH

    ```bash
    test -d ~/.linuxbrew && eval "$(~/.linuxbrew/bin/brew shellenv)"
    test -d /home/linuxbrew/.linuxbrew && eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    test -r ~/.bash_profile && echo "eval \"\$($(brew --prefix)/bin/brew shellenv)\"" >> ~/.bash_profile
    echo "eval \"\$($(brew --prefix)/bin/brew shellenv)\"" >> ~/.profile
    ```

    Verify brew installation

    ```bash
    brew -v
    ```

1.  **Install `Node.js` and `npm`**

        Install Node.js v18 and npm using brew.

        ```bash
        brew install node@18
        ```

        Note: Node.js package includes npm

        Set PATH for node@18

        ```bash
        test -r ~/.bash_profile && echo 'export PATH="/home/linuxbrew/.linuxbrew/opt/node@18/bin:$PATH"' >> ~/.bash_profile
        echo 'export PATH="/home/linuxbrew/.linuxbrew/opt/node@18/bin:$PATH"' >> ~/.profile
        export PATH="/home/linuxbrew/.linuxbrew/opt/node@18/bin:$PATH"
        ```

    Post completing the above, continue from [Verify Node.js and npm Installation](#verify-nodejs-and-npm-installationbash)

### Ubuntu Setup

Follow the below steps to setup and leverage `eks-blueprints` and `eks-blueprints-patterns` in your Ubuntu Linux machine.

1. **Update the package list**

   Update the package list to ensure you're installing the latest versions.

   ```bash
   sudo apt update
   ```

1. **Install `make`**

   ```bash
   sudo apt install make
   ```

1. **Install `brew`** by following instructions as detailed in [docs.brew.sh](https://docs.brew.sh/Homebrew-on-Linux)

   ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

   Add Homebrew to your PATH

   ```bash
   test -d ~/.linuxbrew && eval "$(~/.linuxbrew/bin/brew shellenv)"
   test -d /home/linuxbrew/.linuxbrew && eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
   test -r ~/.bash_profile && echo "eval \"\$($(brew --prefix)/bin/brew shellenv)\"" >> ~/.bash_profile
   echo "eval \"\$($(brew --prefix)/bin/brew shellenv)\"" >> ~/.profile
   ```

   Verify brew installation

   ```bash
   brew -v
   ```

1. **Install `Node.js` and `npm`**

   Install Node.js v18 and npm using brew.

   ```bash
   brew install node@18
   ```

   Note: Node.js package includes npm

   Set PATH for node@18

   ```bash
   test -r ~/.bash_profile && echo 'export PATH="/home/linuxbrew/.linuxbrew/opt/node@18/bin:$PATH"' >> ~/.bash_profile
   echo 'export PATH="/home/linuxbrew/.linuxbrew/opt/node@18/bin:$PATH"' >> ~/.profile
   export PATH="/home/linuxbrew/.linuxbrew/opt/node@18/bin:$PATH"
   ```

Post completing the above, continue from [Verify Node.js and npm Installation](#verify-nodejs-and-npm-installation)

### Mac Setup

Follow the below steps to setup and leverage `eks-blueprints` and `eks-blueprints-patterns` in your local Mac laptop.

1. **Install `make`, `node` and `npm` using brew**

   ```bash
   brew install make
   brew install node@18
   ```

   Note: Node.js package includes npm

   Set PATH for node@18

   ```bash
   echo 'export PATH="/opt/homebrew/opt/node@18/bin:$PATH"' >> ~/.zshrc
   export PATH="/opt/homebrew/opt/node@18/bin:$PATH"
   ```

### Verify `Node.js` and `npm` Installation

1. Check the installed version of Node.js

   ```bash
   node -v
   ```

   The output should be `v18.x.x`.

1. Check the installed version of npm

   ```bash
   npm -v
   ```

   The output should be a version greater than `9.x.x`.

   If your npm version is not `9.x.x` or above, update npm with the following command:

   ```bash
   sudo npm install -g npm@latest
   ```

   Verify the installed version by running `npm -v`.

### Repo setup

1. Clone `cdk-eks-blueprints-patterns` repository

   ```bash
   git clone https://github.com/aws-samples/cdk-eks-blueprints-patterns.git
   cd cdk-eks-blueprints-patterns
   ```

   PS: If you are contributing to this repo, please make sure to fork the repo, add your changes and create a PR against it.

1. Once you have cloned the repo, you can open it using your favourite IDE and run the below commands to install the dependencies and build the existing patterns.

- Install project dependencies.

  ```bash
  make deps
  ```

- To view patterns that are available to be deployed, execute the following:

  ```bash
  npm i
  make build
  ```

- To list the existing CDK EKS Blueprints patterns

  ```bash
  make list
  ```

Note: Some patterns have a hard dependency on AWS Secrets (for example GitHub access tokens). Initially you will see errors complaining about lack of the required secrets. It is normal. At the bottom, it will show the list of patterns which can be deployed, in case the pattern you are looking for is not available, it is due to the hard dependency which can be fixed by following the docs specific to those patterns.

```bash
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
        generative-ai-showcase
        generic-cluster-provider
        guardduty
        jupyterhub
        kasten
        keptn-control-plane
        konveyor
        kubecost
        kubeflow
        kubeshark
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
        gmaestro
        workloads-codecommit
```

- Bootstrap your CDK environment.

  ```bash
  npx cdk bootstrap
  ```

- You can then deploy a specific pattern with the following:

  ```bash
  make pattern multi-team deploy
  ```

# Developer Flow

## Modifications

All files are compiled to the dist folder including `lib` and `bin` directories. For iterative development (e.g. if you make a change to any of the patterns) make sure to run compile:

```bash
make compile
```

The `compile` command is optimized to build only modified files and is fast.

## New Patterns

To create a new pattern, please follow these steps:

1. Under lib create a folder for your pattern, such as `<pattern-name>-construct`. If you plan to create a set of patterns that represent a particular subdomain, e.g. `security` or `hardening`, please create an issue to discuss it first. If approved, you will be able to create a folder with your subdomain name and group your pattern constructs under it.
2. Blueprints generally don't require a specific class, however we use a convention of wrapping each pattern in a plain class like `<Pattern-Name>Construct`. This class is generally placed in `index.ts` under your pattern folder.
3. Once the pattern implementation is ready, you need to include it in the list of the patterns by creating a file `bin/<pattern-name>.ts`. The implementation of this file is very light, and it is done to allow patterns to run independently.

Example simple synchronous pattern:

```typescript
import { configureApp } from "../lib/common/construct-utils";
import FargateConstruct from "../lib/fargate-construct";

new FargateConstruct(configureApp(), "fargate"); // configureApp() will create app and configure loggers and perform other prep steps
```

4. In some cases, patterns need to use async APIs. For example, they may rely on external secrets that you want to validate ahead of the pattern deployment.

Example async pattern:

```typescript
import { configureApp, errorHandler } from "../lib/common/construct-utils";

const app = configureApp();

new NginxIngressConstruct().buildAsync(app, "nginx").catch((e) => {
  errorHandler(
    app,
    "NGINX Ingress pattern is not setup. This maybe due to missing secrets for ArgoCD admin pwd.",
    e
  );
});
```

5. There are a few utility functions that can be used in the pattern implementation such as secret prevalidation. This function will fail if the corresponding secret is not defined, this preventing the pattern to deploy.

```typescript
await prevalidateSecrets(
  NginxIngressConstruct.name,
  undefined,
  SECRET_ARGO_ADMIN_PWD
);
await prevalidateSecrets("my-pattern-name", "us-east-1", "my-secret-name"); //
```

## Contributing

See [Contributing](CONTRIBUTING.md) guide for requirements on contribution.

# Deploying Blueprints with External Dependency on AWS Resources

There are cases when the blueprints defined in the patterns have dependencies on existing AWS Resources such as Secrets defined in the account/region.
For such cases, you may see errors if such resources are not defined.

For [`PipelineMultiEnvGitops`](./lib/pipeline-multi-env-gitops/index.ts) please see instructions in this [README](./docs/patterns/pipeline-multi-env-gitops.md).

For `MultiRegionConstruct` the pattern relies on the following secrets defined:

1. `github-ssh-key` - must contain GitHub SSH private key as a JSON structure containing fields `sshPrivateKey` and `url`. The secret is expected to be defined in `us-east-1` and replicated to `us-east-2` and `us-west-2` regions. For more information on SSH credentials setup see [ArgoCD Secrets Support](https://aws-quickstart.github.io/cdk-eks-blueprints/addons/argo-cd/#secrets-support).
   Example Structure:

```
{
    "sshPrivateKey": "-----BEGIN THIS IS NOT A REAL PRIVATE KEY-----\nb3BlbnNzaC1rtdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAACFwAAAAdzc2gtcn\nNhAAAAAwEAAQAAAgEAy82zTTDStK+s0dnaYzE7vLSAcwsiHM8gN\nhq2p5TfcjCcYUWetyu6e/xx5Rh+AwbVvDV5h9QyMw4NJobwuj5PBnhkc3QfwJAO5wOnl7R\nGbehIleWWZLs9qq`DufViQsa0fDwP6JCrqD14aIozg6sJ0Oqi7vQkV+jR0ht/\nuFO1ANXBn2ih0ZpXeHSbPDLeZQjlOBrbGytnCbdvLtfGEsV0WO2oIieWVXJj/zzpKuMmrr\nebPsfwr36nLprOQV6IhDDo\n-----END NOT A REAL PRIVATE KEY-----\n",

    "url": "git@github"
}
```

Note: You can notice explicit \n characters in the sshPrivateKey.

2. `argo-admin-secret` - must contain ArgoCD admin password in Plain Text. The secret is expected to be defined in `us-east-1` and replicated to `us-east-1` and `us-west-2` regions.

For ``Dynatrace One Agent`

- `dynatrace-tokens` - must contain [API_URL](https://github.com/dynatrace-oss/dynatrace-ssp-addon#aws-secret-manager-secrets), [API_TOKEN](https://github.com/dynatrace-oss/dynatrace-eks-blueprints-addon#aws-secret-manager-secrets) and [PAAS_TOKEN](https://github.com/dynatrace-oss/dynatrace-eks-blueprints-addon#aws-secret-manager-secrets) in Plain Text. The secret is expected to be defined in the target region (either directly or through AWS Secrets Manager Replication).

For `keptn-control-plane` the pattern relies on the following secrets defined:

- `keptn-secrets` - must contain API_TOKEN and BRIDGE_PASSWORD password in Plain Text. The secret is expected to be defined in `us-east-1` region.

For `newrelic` the pattern relies on the following secrets defined:

- `newrelic-pixie-keys` - must contain New Relic (required) and Pixie keys (optional). The secret is expected to be defined in the target region (either directly or through AWS Secrets Manager Replication).

For more information on defining secrets for ArgoCD, please refer to [Blueprints Documentation](https://aws-quickstart.github.io/cdk-eks-blueprints/addons/argo-cd/#secrets-support) as well as [known issues](https://aws-quickstart.github.io/cdk-eks-blueprints/addons/argo-cd/#known-issues).

For `nginx` please see [NGINX Blueprint documentation](docs/patterns/nginx.md).

For `datadog` the pattern relies on the following secret defined:

- `apiKeyAWSSecret` - must contain the Datadog API key in Plain Text named `datadog-api-key`. The secret is expected to be defined in the target region.

For `kubeflow` please see [Kubeflow documentation](docs/patterns/kubeflow.md).

For `secure-ingress-cognito` please see [Secure Ingress using Cognito Blueprint documentation](docs/patterns/secureingresscognito.md).

For `GmaestroConstruct` the pattern relies on the following secret defined:

- `granulate-client-id` - must contain the client_id Plain Text. The secret is expected to be defined in the target region (either directly or through AWS Secrets Manager Replication).
## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
