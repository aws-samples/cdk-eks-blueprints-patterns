# SSP EKS Patterns

Welcome to the `SSP EKS Patterns` repository.

This repository contains a number of samples for how you can leverage the [Amazon EKS SSP Quick Start](https://github.com/aws-quickstart/quickstart-ssp-amazon-eks).

## Patterns 

The individual patterns can be found in the `lib` directory. 

## Documentation

Please refer to the Amazon EKS SSP Quick Start [documentation site](https://aws-quickstart.github.io/quickstart-ssp-amazon-eks) for complete project documentation.

## Usage

Install project dependencies. 

```
make bootstrap
```

To view patterns that are available to be deployed, execute the following: 

```
cdk list
```

Bootstrap your CDK environment.

```
cdk bootstrap
```

We can then deploy a specific pattern with the following:

```
cdk deploy multi-team-blueprint
```

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.

