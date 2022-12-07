# JupyterHub on EKS Pattern

## Objective

JupyterHub is a multi-user Hub that spawns, manages, and proxies multiple instances of the single-user Jupyter notebook server. The Hub can offer notebook servers to a class of students, a corporate data science workgroup, a scientific research project, or a high-performance computing group.

The objective of this pattern is to deploy JupyterHub on EKS 

## Approach

Since we will be defining subdomains for a global enterprise domain across multiple environments, which are as a rule placed in separate AWS accounts, root domain should defined in a separate account. Let's call it global DNS account. 

Sub-domains are then defined in the target accounts (let's call them workload accounts).

Our blueprint will then include the following:

1. AWS Loadbalancer controller to provision an ALB instance with each cluster fronting the Kubernetes Ingress resource. Deployed with a public certificate from ACM that is imported.
2. External DNS to integrate ALB with Route53 and use custom domain to . 
3. Configurations to leverage existing user management via OAuth 2.0 protocol standard.

## Prerequisites
1. Existing Hosted Zone on Route53 with your custom domain
2. Existing Certificate on ACM for your custom domain (preferably wildcards for subdomain of your top-level domain)
3. 

## Deploying

Once all pre-requisites are set you should be able to get a working cluster with all the objectives met, including workloads with an example of team-specific ingress objects. 

