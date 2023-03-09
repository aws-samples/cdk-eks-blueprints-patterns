# EKS Encryption-at-Rest pattern

## Objective

The objective of this pattern is to demonstrate how to enable encryption-at-rest for EKS cluster using EBS/EFS storage.

To achieve this objective, the pattern utilizes [EBS CSI Driver Amazon EKS Add-on](https://aws-quickstart.github.io/cdk-eks-blueprints/addons/ebs-csi-driver/) to enable encryption-at-rest for EBS volumes. The pattern also leverages [EFS CSI Driver Amazon EKS Add-on](https://aws-quickstart.github.io/cdk-eks-blueprints/addons/efs-csi-driver/) to enable encryption-at-rest for EFS volumes.

The pattern also leverages KMS resource provider to create a KMS keys for EBS/EFS encryption-at-rest and EFS File System resource provider to create an encrypted EFS file system.

## GitOps confguration

For GitOps, the blueprint bootstrap the ArgoCD addon and points to the [EKS Blueprints Workload](https://github.com/aws-samples/eks-blueprints-workloads) sample repository.

The sample repository contains the following workloads:

1. team-platform creates a storage class for EBS and EFS volumes.
2. team-data creates a persistent volume claim for EBS and EFS volumes and a pod that mounts the volumes.

## Prerequisites

1. Clone the repository
1. Follow the usage [instructions](README.md#usage) to install the dependencies
1. `argo-admin-password` secret must be defined in Secrets Manager in the same region as the EKS cluster.

## Deploying

To deploy the pattern, run the following command:

```bash
npx cdk deploy data-at-rest-encryption-blueprint
```

Now you can verify that the EBS and EFS volumes are encrypted by running the following commands:

- EBS

```bash
❯ kubectl get pvc -n data
NAME                STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS    AGE
gp2-encrypted-pvc   Bound    pvc-78bd070e-8eba-4b01-a378-462bb806beb3   10Gi       RWO            gp2-encrypted   14m

❯ aws ec2 describe-volumes --region us-east-1 --filters "Name=tag:kubernetes.io/created-for/pv/name,Values=pvc-78bd070e-8eba-4b01-a378-462bb806beb3" --query 'Volumes[*].{VolumeId:VolumeId, Encrypted:Encrypted, KmsKeyId:KmsKeyId}'

[
    {
        "VolumeId": "vol-09332f96a58e67385",
        "Encrypted": true,
        "KmsKeyId": "arn:aws:kms:us-east-1:111122223333:key/a8b9fa0b-955f-4f85-85c1-8f911003390e"
    }
]
```

- EFS

```bash
❯ kubectl get storageclass
NAME                      PROVISIONER             RECLAIMPOLICY   VOLUMEBINDINGMODE      ALLOWVOLUMEEXPANSION   AGE
efs-encrypted (default)   efs.csi.aws.com         Delete          Immediate              false                  70m

❯ kubectl get storageclass efs-encrypted -o jsonpath='{.parameters.kmsKeyId}'
arn:aws:kms:us-east-1:111222333444:key/19f4f602-dcf3-42a5-8eef-38f2af4b3626%  

❯ kubectl get pvc -n data
NAME                  STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS    AGE
efs-encrypted-claim   Bound    pvc-06df2640-ae2f-44ae-8d5c-82c72e56a9ae   10Gi       RWX            efs-encrypted   63m

❯ kubectl get pods -n data
NAME                 READY   STATUS    RESTARTS   AGE
efs-encryption-app   1/1     Running   0          63m

❯ kubectl describe pvc efs-encrypted-claim -n data
Name:          efs-encrypted-claim
Namespace:     data
StorageClass:  efs-encrypted
Status:        Bound
Volume:        pvc-06df2640-ae2f-44ae-8d5c-82c72e56a9ae
Labels:        argocd.argoproj.io/instance=team-data
Annotations:   pv.kubernetes.io/bind-completed: yes
               pv.kubernetes.io/bound-by-controller: yes
               volume.beta.kubernetes.io/storage-provisioner: efs.csi.aws.com
               volume.kubernetes.io/storage-provisioner: efs.csi.aws.com
Finalizers:    [kubernetes.io/pvc-protection]
Capacity:      10Gi
Access Modes:  RWX
VolumeMode:    Filesystem
Used By:       efs-encryption-app
Events:        <none>
```
