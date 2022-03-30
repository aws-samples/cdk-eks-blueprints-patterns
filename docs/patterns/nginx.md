# NGINX Pattern

## Objective

When setting up a target platform across multiple dimensions that question of ingress must be solved. Ideally, it should work in such as way that workloads provisioned on the target environments could be accessible via internet exposing sub-domains of some predefined global domain name. 

Communication with the workloads should leverage secure TLS protected Load balancer with proper public (or private) certificate.

A single cluster will deploy workloads from multiple teams and each of them should be able to expose workloads routed to their corresponding namespace. So, teams are expected to define ingress objects. 

In addition, this approach should work not only for a single cluster, but also across multiple regions and environments. 

## Approach

Since we will be defining subdomains for a global enterprise domain across multiple environments, which are as a rule placed in separate AWS accounts, root domain should defined in a separate account. Let's call it global DNS account. 

Sub-domains are then defined in the target accounts (let's call them workload accounts).

Our blueprint will then include the following:

1. NGINX ingress controller to enable teams to create/configure their ingress objects. 
2. External DNS to integrate NGINX and public-facing NLB with Route53. 
3. AWS Loadbalancer controller to provision an NLB instance with each cluster fronting the NGINX ingress. Deployed with a public certificate that will also be provisioned as part of the blueprint.
4. Team onboarding that leverage the ingress capabilities through ArgoCD. 
5. Other popular add-ons.

## Prerequisites
1. `argo-admin-password` secret must be defined as plain text (not key/value) in `us-west-2`  region.
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
4. The actual settings for the GLOBAL_DNS_ACCOUNT, hosted zone name and expected subzone name are expected to be specified in the CDK context. Generically it is inside the cdk.context.json file of the current directory or in `~/.cdk.json` in your home directory. Example settings:
```
{
  "context": {
    "parent.dns.account": "<PARENT_ACCOUNT>",
    "parent.hostedzone.name": "mycompany.a2z.com",
    "dev.subzone.name": "dev.mycompany.a2z.com",
  }
}
```


## Deploying

Once all pre-requisites are set you should be able to get a working cluster with all the objectives met, including workloads with an example of team-specific ingress objects. 

