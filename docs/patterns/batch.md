# AWS Batch on Amazon EKS Pattern

## Objective

AWS Batch helps you run batch computing workloads on AWS. Using Amazon EKS as the compute resource, you can now schedule and scale batch workloads into new or existing EKS cluster. As part of the deployment, AWS Batch doesn't create, administer, or perform lifecycle operations of the EKS cluster, but will only scale up and down the nodes maanged by AWS Batch and run pods on those nodes to complete batch jobs. 

The objective of this pattern is to deploy AWS Batch on Amazon EKS using EKS Blueprints with the following features in place:
- Batch addon implemented
- Batch Team defined with a sample compute environment and job queue (as defined under `lib/teams/team-batch`) - This can be customized based on your needs
- Fluent Bit addon implemented to monitor AWS Batch on Amazon EKS jobs using CloudWatch, with the proper permissions for sending logs