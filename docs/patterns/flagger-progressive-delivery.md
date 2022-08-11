# Progressive Delivery via flagger addon Pattern

## Objective

When a developer wants to utilize progressive delivery they had to find workarounds and it has been requested to be an addon. This solves that issue and shows how to use it via the flagger addon. The addon gives users the custom resource definition (CRD's) needed to use canary files which allow for progressive delivery.

## Approach

Our blueprint will then include the following:

1. ArgoCDAddOn to use our example repo for utilizing the canary files with nginx mesh provider
2. FlaggerAddON with meshProvider set to MeshProviderOptions.NGINX to change from the kuberneties default
3. NginxAddOn which allows the canaries to see the examples generated traffic after altering the values
4. AwsLoadBalancerControllerAddOn is simply needed in order to utilize the NginxAddOn

## Prerequisites
1. `argocd-password` secret must be defined as plain text (not key/value) in `us-east-2` region.

## Deploying

```
cdk deploy progressive-delivery-blueprint
```

Once all pre-requisites are set you should be able to get a working cluster with all the objectives met, including workloads with an example of team-specific ingress objects. 

## After Deployment

After it is deployed properly and your canary is initialized you can update your deployment. If you change your imaged in deployment.yaml from `nikunjv/flask-image:blue` to `nikunjv/flask-image:green` the progressive delivery begins. Now monitor your canary file and it will take roughly 10 minuets as it progressively updates your version via blue green deployment.