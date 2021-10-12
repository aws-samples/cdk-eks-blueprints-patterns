# SSP EKS Patterns

## Working with the repo



uses cdk 1.124.0 not latest 1.126.0
```bash
npm i @aws-cdk/core  
npm i @aws-cdk/aws-s3
npm i @aws-cdk/aws-eks
npm i @aws-cdk/aws-iam
npm i @aws-cdk/aws-ec2


```

```bash
make deps build
```

```bash
make list
```


## Troubleshoot


### CDK packages compatibility errors 

Fix issues with cdk versions

```
rm package-lock.json   
rm -rf node_modules  
```

you mzy also select fix values for dependencies by removing the preffix ^

ex in package.json:

```json
  "dependencies": {
    "@aws-cdk/aws-ec2": "1.124.0",
    "@aws-cdk/aws-eks": "1.124.0",
    "@aws-cdk/aws-iam": "1.124.0",
    "@aws-cdk/aws-s3": "1.124.0",
    "@aws-quickstart/ssp-amazon-eks": "^0.12.1",
    "source-map-support": "^0.5.16"
  }
```

### github-ssh-key ResourceNotFoundException: Secrets Manager can't find the specified secret.