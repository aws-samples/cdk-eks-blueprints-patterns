# JupyterHub on EKS Pattern

## Objective

JupyterHub is a multi-user Hub that spawns, manages, and proxies multiple instances of the single-user Jupyter notebook server. The hub can offer notebook servers to a class of students, a corporate data science workgroup, a scientific research project, or a high-performance computing group.

The objective of this pattern is to deploy JupyterHub on EKS using EKS Blueprints with the following features in place:
- JupyterHub is hosted behind an ALB on EKS cluster across multiple AZ
- JupyterHub leverages an identity provider for user authentication.
- JupyterHub uses persistent storage that is provided within a file system (i.e. EFS) when the user logs in
- JupyterHub uses certificates to provide secured connection to the hub (the load balancer)
- JupyterHub allows for user friendly DNS name to route traffic to the load balancer

## Approach

Our blueprint will then include the following:

1. AWS Loadbalancer controller to provision an ALB instance fronting the Kubernetes Ingress resource for the JupyterHub server. Deployed with an imported public certificate from ACM (Certificate ARN must be provided)
2. External DNS to integrate ALB with Route53 and use custom domain to access the hub. 
3. Configurations to leverage existing user management via OAuth 2.0 protocol standard (i.e. Auth0).
4. EFS file server for persistent storage using the blueprint

## Prerequisites
1. Existing Hosted Zone on Route53 with your custom domain.
2. Existing Certificate on ACM for your custom domain (preferably wildcards for subdomain of your top-level domain)
3. Identity Provider that can be leveraged using 0Auth 2.0 protocol.

## Deploying

Once all pre-requisites are set you should be able to get a working cluster with all the objectives met, including a JupyterHub where users can log in using their credentials from the identity provider given.

