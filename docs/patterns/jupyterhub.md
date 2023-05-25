# JupyterHub on EKS Pattern

## Objective

JupyterHub is a multi-user Hub that spawns, manages, and proxies multiple instances of the single-user Jupyter notebook server. The hub can offer notebook servers to a class of students, a corporate data science workgroup, a scientific research project, or a high-performance computing group.

The objective of this pattern is to deploy JupyterHub on EKS using EKS Blueprints with the following features in place:
- JupyterHub is hosted behind an ALB on EKS cluster across multiple AZs
- JupyterHub allows for user friendly DNS name to route traffic to the load balancer, which is a subdomain of a parent domain in a separate account. This is representatitve of a typical global enterprise domain setup, where a central, global DNS account defines the parent domain (in Route53). The subdomain will be defined in Route53 from this account where the JupyterHub cluster is provisioned.
- JupyterHub leverages an identity provider for user authentication.
- JupyterHub uses persistent storage that is provided within a file system (i.e. EFS) when the user logs in
- JupyterHub uses certificates to provide secured connection to the hub (the load balancer) 
- The hub has a persistent storage with an EBS volume

## Approach

Since we will be defining subdomains for a global enterprise domain across multiple environments, which are as a rule placed in separate AWS accounts, root domain should defined in a separate account. Let's call it global DNS account. 

Our blueprint will then include the following:

1. AWS Loadbalancer controller to provision an ALB instance fronting the Kubernetes Ingress resource for the JupyterHub server. Deployed with a public certificate created from ACM (Certificate ARN must be provided post-creation via CDK context)
2. External DNS to integrate ALB with Route53 and use custom domain to access the hub. 
3. Configurations to leverage existing user management via OAuth 2.0 protocol standard (i.e. Auth0).
4. EFS file server for user persistent storage using the Blueprints.
5. EBS volume for hub persistent storage.

## Prerequisites
1. Identity Provider that can be leveraged using 0Auth 2.0 protocol. The actual settings are expected to be specified in the CDK context. Generically it is inside the cdk.context.json file of the current directory or in `~/.cdk.json` in your home directory. Example settings:
```
{
  "context": {
    "callbackUrl": "https://your.hub.domain.com/hub/oauth_callback",
    "authUrl": "https://some.auth.address.com/authorize",
    "tokenUrl": "https://some.auth.address.com/oauth/token",
    "userDataUrl": "https://some.auth.address.com/userinfo",
    "clientId": "someClientID",
    "clientSecret": "someClientSecret",
    "scope": ["openid","name","profile","email"],
    "usernameKey": "name"
  }
}
```
2. The parent domain must be defined in a separate account (GLOBAL_DNS_ACCOUNT).
3. The GLOBAL_DNS_ACCOUNT must contain a role with a trust policy to the workload(s) account. We naed it `DomainOperatorRole` but you can choose any arbitrary name for it.
   1. Policies:  `arn:aws:iam::aws:policy/AmazonRoute53DomainsFullAccess` or alternatively you can provide `arn:aws:iam::aws:policy/AmazonRoute53ReadOnlyAccess` and `arn:aws:iam::aws:policy/AmazonRoute53AutoNamingFullAccess`.
   2. Trust relationship to allow workload accounts to create subdomains (replace `<WORKLOAD_ACCOUNT>` with the actual value): 
   ```
   {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::<WORKLOAD_ACCOUNT>:root"
            },
            "Action": "sts:AssumeRole",
            "Condition": {}
        }
    ]
   }
   ```
4. The actual settings for the GLOBAL_DNS_ACCOUNT, hosted zone name, subzone name, and the JupyterHub hub subdomain names are expected to be specified in the CDK context. Generically it is inside the cdk.context.json file of the current directory or in `~/.cdk.json` in your home directory. Example settings:
```
{
  "context": {
    "parent.dns.account": "<PARENT_ACCOUNT>",
    "parent.hostedzone.name": "domain.com",
    "dev.subzone.name": "hub.domain.com",
    "jupyterhub.subzone.name":"your.hub.domain.com",
  }
}
```

## Deploying

Once all pre-requisites are set you should be able to get a working cluster with all the objectives met, including a JupyterHub where users can log in using their credentials from the identity provider given.

