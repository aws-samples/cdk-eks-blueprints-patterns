# EKS Blueprints Patterns

Welcome to the `EKS Blueprints Patterns` repository.

This repository contains a number of samples for how you can leverage the [Amazon EKS Blueprints](https://github.com/aws-quickstart/cdk-eks-blueprints). You can think of the patterns as "codified" reference architectures, which can be explained and executed as code in the customer environment.

## Patterns 

The individual patterns can be found in the `lib` directory.  Most of the patterns are self-explanatory, for some more complex examples please use this guide and docs/patterns directory for more information.

## Documentation

Please refer to the Amazon EKS Blueprints Quick Start [documentation site](https://aws-quickstart.github.io/cdk-eks-blueprints/) for complete project documentation.

## Usage

Install project dependencies. 

```
make deps
```

To view patterns that are available to be deployed, execute the following: 

```
cdk list
```

Note: Some patterns have a hard dependency on AWS Secrets (for example GitHub access tokens). Initially you will see errors complaining about lack of the required secrets. It is normal. 

Bootstrap your CDK environment.

```
cdk bootstrap
```

We can then deploy a specific pattern with the following:

```
cdk deploy multi-team-blueprint
```

# Deploying Blueprints with External Dependency on AWS Resources

There are cases when the blueprints defined in the patterns have dependencies on existing AWS Resources such as Secrets defined in the account/region.
For such cases, you may see errors if such resources are not defined. 

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
3. `keptn-secrets` - must contain API_TOKEN and BRIDGE_PASSWORD password in Plain Text. The secret is expected to be defined in `us-east-1` region.

For more information on defining secrets for ArgoCD, please refer to [Blueprints Documentation](https://github.com/aws-quickstart/cdk-eks-blueprints/blob/main/docs/addons/argo-cd.md#secrets-support) as well as [known issues](https://github.com/aws-quickstart/cdk-eks-blueprints/blob/main/docs/addons/argo-cd.md#known-issues).

For `NginxIngressConstruct`  please see [NGINX Blueprint documentation](docs/patterns/nginx.md).

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.