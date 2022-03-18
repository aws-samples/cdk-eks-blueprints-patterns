# SSP EKS Patterns

Welcome to the `SSP EKS Patterns` repository.

This repository contains a number of samples for how you can leverage the [Amazon EKS SSP Quick Start](https://github.com/aws-quickstart/ssp-amazon-eks).

## Patterns 

The individual patterns can be found in the `lib` directory. 

## Documentation

Please refer to the Amazon EKS SSP Quick Start [documentation site](https://aws-quickstart.github.io/ssp-amazon-eks/) for complete project documentation.

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

Deploy nginx Example

```bash
cdk deploy nginx-blueprint --require-approval never
```

Deploy multi-region pipeline
```bash
cdk deploy --require-approval never ssp-pipeline-stack  
```

cdk bootstrap \
  --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess \
  aws://382076407153/us-east-2
cdk bootstrap \
  --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess \
  aws://382076407153/eu-west-3
cdk bootstrap \
  --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess \
  aws://382076407153/eu-west-1


# Deploying Blueprints with External Dependency on AWS Resources

There are cases when the blueprints defined in the SSP Patterns have dependencies on existing AWS Resources such as Secrets defined in the account/region.
For such cases, you may see errors if such resources are not defined. 

For `MultiRegionConstruct` the pattern relies on the following secrets defined:

1. `github-ssh-key` - must contain GitHub SSH private key in Plain Text. The secret is expected to be defined in `us-east-1` and replicated to `us-east-1` and `us-west-2` regions.
2. `argo-admin-secret` - must contain ArgoCD admin password in Plain Text. The secret is expected to be defined in `us-east-1` and replicated to `us-east-1` and `us-west-2` regions.
3. `keptn-secrets` - must contain API_TOKEN and BRIDGE_PASSWORD password in Plain Text. The secret is expected to be defined in `us-east-1` region.

For more information on defining secrets for ArgoCD, please refer to [SSP Documentation](https://github.com/aws-quickstart/ssp-amazon-eks/blob/main/docs/addons/argo-cd.md#secrets-support) as well as [known issues](https://github.com/aws-quickstart/ssp-amazon-eks/blob/main/docs/addons/argo-cd.md#known-issues).

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.