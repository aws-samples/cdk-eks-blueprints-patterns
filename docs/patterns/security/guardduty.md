# Amazon GuardDuty Protection

## Objective

The objective of this pattern is to demonstrate how to enable Amazon GuardDuty Detector across your AWS accounts, various data sources, and how to automate notifications via Amazon SNS based on security vulnerabilities triggered by Amazon GuardDuty.

Supported optional data sources:

- [EKS Protection and Kubernetes audit logs](https://docs.aws.amazon.com/guardduty/latest/ug/kubernetes-protection.html)
- [Malware Protection](https://docs.aws.amazon.com/guardduty/latest/ug/malware-protection.html)
- [Amazon S3 Protection](https://docs.aws.amazon.com/guardduty/latest/ug/s3-protection.html)

To achieve this objective, the pattern utilizes [Nested Stack Add-on](https://aws-quickstart.github.io/cdk-eks-blueprints/addons/nested-stack/) to enable GuardDuty Detector for the account. The pattern also creates an SNS topic, SNS Subscription, and CloudWatch Event Rule

The list of optional data sources is adjustable via the `GuardDutySetupStack.builder` input in the pattern.

## GitOps confguration

For GitOps, the blueprint bootstraps the ArgoCD addon and points to the [EKS Blueprints Workload](https://github.com/aws-samples/eks-blueprints-workloads) sample repository.

The sample repository contains the following workloads:

- `team-danger` runs a pod in a privileged mode which is a [security anti-pattern](https://docs.aws.amazon.com/guardduty/latest/ug/guardduty_finding-types-kubernetes.html#privilegeescalation-kubernetes-privilegedcontainer)
- `team-danger` runs a pod with a [malicious file](https://docs.aws.amazon.com/guardduty/latest/ug/findings-malware-protection.html#execution-malware-kubernetes-maliciousfile)

## Prerequisites

1. Clone the repository
1. Follow the usage [instructions](README.md#usage) to install the dependencies
1. `argo-admin-password` secret must be defined in Secrets Manager in the same region as the EKS cluster.

## Deploying

To deploy the pattern, run the following command:

```bash
npx cdk deploy guardduty-blueprint
```

## Verifying

Now you can check that the GuardDuty detector is successfully enabled with all the required data sources.

```bash
❯ aws guardduty list-detectors --region us-east-1

{
    "DetectorIds": [
        "94c3858788bc1444ceedab472bab5d7e"
    ]
}

❯ aws guardduty get-detector --detector-id 94c3858788bc1444ceedab472bab5d7e --region us-east-1

{
  "CreatedAt": "2023-03-22T16:13:02.228Z",
  "FindingPublishingFrequency": "SIX_HOURS",
  "ServiceRole": "arn:aws:iam::123456789012:role/aws-service-role/guardduty.amazonaws.com/AWSServiceRoleForAmazonGuardDuty",
  "Status": "ENABLED",
  "UpdatedAt": "2023-03-22T16:13:02.228Z",
  "DataSources": {
    "CloudTrail": {
      "Status": "ENABLED"
    },
    "DNSLogs": {
      "Status": "ENABLED"
    },
    "FlowLogs": {
      "Status": "ENABLED"
    },
    "S3Logs": {
      "Status": "ENABLED"
    },
    "Kubernetes": {
      "AuditLogs": {
        "Status": "ENABLED"
      }
    },
    "MalwareProtection": {
      "ScanEc2InstanceWithFindings": {
        "EbsVolumes": {
          "Status": "ENABLED"
        }
      },
      "ServiceRole": "arn:aws:iam::123456789012:role/aws-service-role/malware-protection.guardduty.amazonaws.com/AWSServiceRoleForAmazonGuardDutyMalwareProtection"
    }
  },
  "Tags": {}
}
 ```

The list of findings contains `PrivilegeEscalation:Kubernetes/PrivilegedContainer` as expected:

```bash
❯ aws guardduty list-findings --detector-id 94c3858788bc1444ceedab472bab5d7e --region us-east-1

{
    "FindingIds": [
        "f2c3859c6ca25b3057d13470a992bbd7"
    ]
}

❯ aws guardduty get-findings --detector-id 94c3858788bc1444ceedab472bab5d7e --finding-ids f2c3859c6ca25b3057d13470a992bbd7 --region us-east-1

{
    "Findings": [
        {
            "AccountId": "123456789012",
            "Arn": "arn:aws:guardduty:us-east-1:123456789012:detector/94c3858788bc1444ceedab472bab5d7e/finding/f2c3859c6ca25b3057d13470a992bbd7",
            "CreatedAt": "2023-03-22T21:28:07.748Z",
            "Description": "A privileged container with root level access was launched on EKS Cluster guardduty-blueprint. If this behavior is not expected, it may indicate that your credentials are compromised.",
            "Id": "f2c3859c6ca25b3057d13470a992bbd7",
            "Partition": "aws",
            "Region": "us-east-1",
            "Resource": {
                "EksClusterDetails": {
                    "Name": "guardduty-blueprint",
                    "Arn": "arn:aws:eks:us-east-1:123456789012:cluster/guardduty-blueprint",
                    "VpcId": "vpc-02b68c9ddc1d403ab",
                    "Status": "ACTIVE",
                    "Tags": [],
                    "CreatedAt": "2023-03-22T15:48:25.752000-05:00"
                },
                "KubernetesDetails": {
                    "KubernetesUserDetails": {
                        "Username": "system:serviceaccount:argocd:argocd-application-controller",
                        "Uid": "1871d525-442e-487f-ae60-81336d1ff0cf",
                        "Groups": [
                            "system:serviceaccounts",
                            "system:serviceaccounts:argocd",
                            "system:authenticated"
                        ]
                    },
                    "KubernetesWorkloadDetails": {
                        "Name": "privileged-pod",
                        "Type": "pods",
                        "Uid": "33a3c89e-3280-474d-b8cb-fdf03394fc15",
                        "Namespace": "argocd",
                        "HostNetwork": false,
                        "Containers": [
                            {
                                "Name": "app",
                                "Image": "centos",
                                "ImagePrefix": "",
                                "SecurityContext": {
                                    "Privileged": true
                                }
                            }
                        ]
                    }
                },
                "ResourceType": "EKSCluster"
            },
            "SchemaVersion": "2.0",
            "Service": {
                "Action": {
                    "ActionType": "KUBERNETES_API_CALL",
                    "KubernetesApiCallAction": {
                        "RequestUri": "/api/v1/namespaces/argocd/pods",
                        "Verb": "create",
                        "UserAgent": "argocd-application-controller/v0.0.0 (linux/amd64) kubernetes/$Format",
                        "RemoteIpDetails": {
                            "City": {
                                "CityName": "UNKNOWN"
                            },
                            "Country": {},
                            "GeoLocation": {
                                "Lat": 0.0,
                                "Lon": 0.0
                            },
                            "IpAddressV4": "10.0.205.129",
                            "Organization": {
                                "Asn": "0",
                                "AsnOrg": "UNKNOWN",
                                "Isp": "UNKNOWN",
                                "Org": "UNKNOWN"
                            }
                        },
                        "StatusCode": 201
                    }
                },
                "Archived": false,
                "Count": 1,
                "DetectorId": "94c3858788bc1444ceedab472bab5d7e",
                "EventFirstSeen": "2023-03-22T21:27:18.186Z",
                "EventLastSeen": "2023-03-22T21:27:18.630Z",
                "ResourceRole": "TARGET",
                "ServiceName": "guardduty",
                "AdditionalInfo": {
                    "Value": "{}",
                    "Type": "default"
                }
            },
            "Severity": 5,
            "Title": "Privileged container with root level access launched on the EKS Cluster.",
            "Type": "PrivilegeEscalation:Kubernetes/PrivilegedContainer",
            "UpdatedAt": "2023-03-22T21:28:07.748Z"
        }
    ]
}
```
