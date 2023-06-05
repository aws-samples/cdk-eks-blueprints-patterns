# Amazon ECR Image Scanning

## Objective

The objective of this pattern is to demonstrate how to enable and configure Amazon ECR image scanning.

The following scanning types are offered:

- Enhanced scanning—Amazon ECR integrates with Amazon Inspector to provide automated, continuous scanning of your repositories. Your container images are scanned for both operating systems and programing language package vulnerabilities. As new vulnerabilities appear, the scan results are updated and Amazon Inspector emits an event to EventBridge to notify you.
- Basic scanning—Amazon ECR uses the Common Vulnerabilities and Exposures (CVEs) database from the open-source Clair project. With basic scanning, you configure your repositories to scan on push or you can perform manual scans and Amazon ECR provides a list of scan findings.

The pattern consists of two components:

- `ImageScanningSetupStack` - configures the Amazon ECR image scanning and the ECR automated re-scan duration in Inspector.
- A blueprint that deploys a sample GitOps workload that pushes images to Amazon ECR and triggers the image scanning.

## Configuration

You can configure the following parameters in the [ImageScanningSetupStack](../../../lib/security/image-vulnerability-scanning/image-scanning-setup.ts) stack:

- `scanType` - The type of scan to perform. Valid values are `BASIC` and `ENHANCED`.
- Enhanced scanning only:
  - `enhancedContinuousScanDuration` - the Amazon ECR automated re-scan duration setting determines how long Amazon Inspector continuously monitors images pushed into repositories. When the number of days from when an image is first pushed exceeds the automated re-scan duration configuration, Amazon Inspector stops monitoring the image. When Amazon Inspector stops monitoring an image, the scan status of the image is changed to inactive with a reason code of expired, and all associated findings for the image are scheduled to be closed. Valid values are `LIFETIME`, `DAYS_30`, and `DAYS_180`.
  - `enhancedScanRules` - the scanning rules.
- Basic scanning only:
  - `basicScanRules` - the scanning rules.

Please refer to the [Amazon ECR Image Scanning](https://docs.aws.amazon.com/AmazonECR/latest/userguide/image-scanning.html) documentation for more information and how to use filters.

## GitOps confguration

For GitOps, the blueprint bootstraps the ArgoCD addon and points to the [EKS Blueprints Workload](https://github.com/aws-samples/eks-blueprints-workloads) sample repository.

The sample repository contains the following workloads:

- `team-scan` pushes a Docker image to Amazon ECR and triggers the image scanning.

## Prerequisites

1. Clone the repository
2. Follow the usage [instructions](../../../README.md#usage) to install the dependencies
3. `argo-admin-password` secret must be defined in Secrets Manager in the same region as the EKS cluster.

## Deploy

To update npm, run the following command:

```bash
npm install -g npm@latest
```

To bootstrap the CDK toolkit and list all stacks in the app, run the following commands:

```bash
cdk bootstrap
make list
```

### Deploying the `ImageScanningSetupStack` stack

The `ImageScanningSetupStack` configures the Amazon ECR image scanning and the ECR automated re-scan duration in Inspector.

To deploy the stack, run the following command:

```bash
make pattern ecr-image-scanning deploy image-scanning-setup
```

### Deploying the blueprint

The blueprint deploys a sample GitOps workload that pushes images to Amazon ECR and triggers the image scanning.

To deploy the blueprint, run the following command:

```bash
make pattern ecr-image-scanning deploy image-scanning-workload-blueprint
```

## Verify

### Verifying that the image scanning is enabled

To verify that the image scanning is enabled at the registry level, run the following command:

```bash
aws ecr get-registry-scanning-configuration
```

The output should look similar to the following:

```json
{
    "registryId": "123456789012",
    "scanningConfiguration": {
        "scanType": "ENHANCED",
        "rules": [
            {
                "scanFrequency": "CONTINUOUS_SCAN",
                "repositoryFilters": [
                    {
                        "filter": "prod",
                        "filterType": "WILDCARD"
                    }
                ]
            },
            {
                "scanFrequency": "SCAN_ON_PUSH",
                "repositoryFilters": [
                    {
                        "filter": "*",
                        "filterType": "WILDCARD"
                    }
                ]
            }
        ]
    }
}
```

### Verifying that the image is pushed to Amazon ECR

To verify that the image is pushed to Amazon ECR, run the following command (please replace `<REPOSITORY-NAME>` with the repository name):

```bash
aws ecr describe-images --repository-name <REPOSITORY-NAME>
```

The output should look similar to the following:

```json
{
    "imageDetails": [
        {
            "registryId": "123456789012",
            "repositoryName": "image-scanning-workload-blueprint-imagescanningrepository754c6116-arh0wk3afnkw",
            "imageDigest": "sha256:a1801b843b1bfaf77c501e7a6d3f709401a1e0c83863037fa3aab063a7fdb9dc",
            "imageTags": [
                "latest"
            ],
            "imageSizeInBytes": 83520228,
            "imagePushedAt": "2023-04-17T17:22:33-05:00",
            "imageManifestMediaType": "application/vnd.docker.distribution.manifest.v2+json",
            "artifactMediaType": "application/vnd.docker.container.image.v1+json",
            "lastRecordedPullTime": "2023-04-17T17:22:33.966000-05:00"
        }
    ]
}
```

### Checking the image scanning findings

To check the image scanning findings, run the following command (please replace `<REPOSITORY-NAME>` with the repository name):

```bash
aws ecr describe-image-scan-findings --repository-name <REPOSITORY-NAME> --image-id imageTag=latest
```

The output should look similar to the following:

```json
{
    "imageScanFindings": {
        "enhancedFindings": [
            {
                "awsAccountId": "123456789012",
                "description": "basic/unit-name.c in systemd prior to 246.15, 247.8, 248.5, and 249.1 has a Memory Allocation with an Excessive Size Value (involving strdupa and alloca for a pathname controlled by a local attacker) that results in an operating system crash.",
                "findingArn": "arn:aws:inspector2:us-east-1:123456789012:finding/0407d7719da0fc8a8f44991f0bf524d6",
                "firstObservedAt": "2023-04-17T17:40:39.940000-05:00",
                "lastObservedAt": "2023-04-17T17:40:39.940000-05:00",
                "packageVulnerabilityDetails": {
                    "cvss": [
                        {
                            "baseScore": 4.9,
                            "scoringVector": "AV:L/AC:L/Au:N/C:N/I:N/A:C",
                            "source": "NVD",
                            "version": "2.0"
                        },
                        {
                            "baseScore": 5.5,
                            "scoringVector": "CVSS:3.1/AV:L/AC:L/PR:L/UI:N/S:U/C:N/I:N/A:H",
                            "source": "NVD",
                            "version": "3.1"
                        }
                    ],
                    "referenceUrls": [
                        "https://www.debian.org/security/2021/dsa-4942",
                        "https://lists.fedoraproject.org/archives/list/package-announce@lists.fedoraproject.org/message/42TMJVNYRY65B4QCJICBYOEIVZV3KUYI/",
                        "https://lists.fedoraproject.org/archives/list/package-announce@lists.fedoraproject.org/message/2LSDMHAKI4LGFOCSPXNVVSEWQFAVFWR7/",
                        "https://security.gentoo.org/glsa/202107-48",
                        "https://cert-portal.siemens.com/productcert/pdf/ssa-222547.pdf"
                    ],
                    "relatedVulnerabilities": [],
                    "source": "NVD",
                    "sourceUrl": "https://nvd.nist.gov/vuln/detail/CVE-2021-33910",
                    "vendorCreatedAt": "2021-07-20T14:15:00-05:00",
                    "vendorSeverity": "MEDIUM",
                    "vendorUpdatedAt": "2022-06-14T06:15:00-05:00",
                    "vulnerabilityId": "CVE-2021-33910",
                    "vulnerablePackages": [
                        {
                            "arch": "X86_64",
                            "epoch": 0,
                            "name": "systemd-pam",
                            "packageManager": "OS",
                            "release": "45.el8",
                            "sourceLayerHash": "sha256:a1d0c75327776413fa0db9ed3adcdbadedc95a662eb1d360dad82bb913f8a1d1",
                            "version": "239"
                        },
                        {
                            "arch": "X86_64",
                            "epoch": 0,
                            "name": "systemd",
                            "packageManager": "OS",
                            "release": "45.el8",
                            "sourceLayerHash": "sha256:a1d0c75327776413fa0db9ed3adcdbadedc95a662eb1d360dad82bb913f8a1d1",
                            "version": "239"
                        },
                        {
                            "arch": "X86_64",
                            "epoch": 0,
                            "name": "systemd-libs",
                            "packageManager": "OS",
                            "release": "45.el8",
                            "sourceLayerHash": "sha256:a1d0c75327776413fa0db9ed3adcdbadedc95a662eb1d360dad82bb913f8a1d1",
                            "version": "239"
                        },
                        {
                            "arch": "X86_64",
                            "epoch": 0,
                            "name": "systemd-udev",
                            "packageManager": "OS",
                            "release": "45.el8",
                            "sourceLayerHash": "sha256:a1d0c75327776413fa0db9ed3adcdbadedc95a662eb1d360dad82bb913f8a1d1",
                            "version": "239"
                        }
                    ]
                },
                "remediation": {
                    "recommendation": {
                        "text": "None Provided"
                    }
                },
                "resources": [
                    {
                        "details": {
                            "awsEcrContainerImage": {
                                "architecture": "amd64",
                                "imageHash": "sha256:a1801b843b1bfaf77c501e7a6d3f709401a1e0c83863037fa3aab063a7fdb9dc",
                                "imageTags": [
                                    "latest"
                                ],
                                "platform": "CENTOS_8",
                                "pushedAt": "2023-04-17T17:22:33-05:00",
                                "registry": "123456789012",
                                "repositoryName": "image-scanning-workload-blueprint-imagescanningrepository754c6116-arh0wk3afnkw"
                            }
                        },
                        "id": "arn:aws:ecr:us-east-1:123456789012:repository/image-scanning-workload-blueprint-imagescanningrepository754c6116-arh0wk3afnkw/sha256:a1801b843b1bfaf77c501e7a6d3f709401a1e0c83863037fa3aab063a7fdb9dc",
                        "tags": {},
                        "type": "AWS_ECR_CONTAINER_IMAGE"
                    }
                ],
                "score": 5.5,
                "scoreDetails": {
                    "cvss": {
                        "adjustments": [],
                        "score": 5.5,
                        "scoreSource": "NVD",
                        "scoringVector": "CVSS:3.1/AV:L/AC:L/PR:L/UI:N/S:U/C:N/I:N/A:H",
                        "version": "3.1"
                    }
                },
                "severity": "MEDIUM",
                "status": "ACTIVE",
                "title": "CVE-2021-33910 - systemd-pam, systemd and 2 more",
                "type": "PACKAGE_VULNERABILITY",
                "updatedAt": "2023-04-17T17:40:39.940000-05:00"
            },
        }
...            
```

You can also check the findings in Inspector2.

```bash
aws inspector2 list-findings
```

The output should look similar to the following:

```json
{
    "findings": [
        {
            "awsAccountId": "123456789012",
            "description": "When curl is instructed to get content using the metalink feature, and a user name and password are used to download the metalink XML file, those same credentials are then subsequently passed on to each of the servers from which curl will download or try to download the contents from. Often contrary to the user's expectations and intentions and without telling the user it happened.",
            "exploitAvailable": "NO",
            "findingArn": "arn:aws:inspector2:us-east-1:123456789012:finding/006e8eac196bf27417099413ce74eb1a",
            "firstObservedAt": "2023-04-14T21:03:02.932000-05:00",
            "fixAvailable": "YES",
            "inspectorScore": 5.3,
            "inspectorScoreDetails": {
                "adjustedCvss": {
                    "adjustments": [],
                    "cvssSource": "NVD",
                    "score": 5.3,
                    "scoreSource": "NVD",
                    "scoringVector": "CVSS:3.1/AV:N/AC:H/PR:N/UI:R/S:U/C:H/I:N/A:N",
                    "version": "3.1"
                }
            },
            "lastObservedAt": "2023-04-17T13:34:41.687000-05:00",
            "packageVulnerabilityDetails": {
                "cvss": [
                    {
                        "baseScore": 2.6,
                        "scoringVector": "AV:N/AC:H/Au:N/C:P/I:N/A:N",
                        "source": "NVD",
                        "version": "2.0"
                    },
                    {
                        "baseScore": 5.3,
                        "scoringVector": "CVSS:3.1/AV:N/AC:H/PR:N/UI:R/S:U/C:H/I:N/A:N",
                        "source": "NVD",
                        "version": "3.1"
                    }
                ],
                "referenceUrls": [
                    "https://hackerone.com/reports/1213181",
                    "https://security.gentoo.org/glsa/202212-01",
                    "https://cert-portal.siemens.com/productcert/pdf/ssa-389290.pdf",
                    "https://lists.fedoraproject.org/archives/list/package-announce@lists.fedoraproject.org/message/FRUCW2UVNYUDZF72DQLFQR4PJEC6CF7V/",
                    "https://www.oracle.com/security-alerts/cpuoct2021.html"
                ],
                "relatedVulnerabilities": [],
                "source": "NVD",
                "sourceUrl": "https://nvd.nist.gov/vuln/detail/CVE-2021-22923",
                "vendorCreatedAt": "2021-08-05T16:15:00-05:00",
                "vendorSeverity": "MEDIUM",
                "vendorUpdatedAt": "2023-01-05T12:17:00-06:00",
                "vulnerabilityId": "CVE-2021-22923",
                "vulnerablePackages": [
                    {
                        "arch": "AARCH64",
                        "epoch": 0,
                        "fixedInVersion": "0:7.61.1-18.el8_4.1",
                        "name": "curl",
                        "packageManager": "OS",
                        "release": "18.el8",
                        "remediation": "dnf update curl",
                        "sourceLayerHash": "sha256:52f9ef134af7dd14738733e567402af86136287d9468978d044780a6435a1193",
                        "version": "7.61.1"
                    },
                    {
                        "arch": "AARCH64",
                        "epoch": 0,
                        "fixedInVersion": "0:7.61.1-18.el8_4.1",
                        "name": "libcurl-minimal",
                        "packageManager": "OS",
                        "release": "18.el8",
                        "remediation": "dnf update libcurl-minimal",
                        "sourceLayerHash": "sha256:52f9ef134af7dd14738733e567402af86136287d9468978d044780a6435a1193",
                        "version": "7.61.1"
                    }
                ]
            },
            "remediation": {
                "recommendation": {
                    "text": "None Provided"
                }
            },
            "resources": [
                {
                    "details": {
                        "awsEcrContainerImage": {
                            "architecture": "arm64",
                            "imageHash": "sha256:65a4aad1156d8a0679537cb78519a17eb7142e05a968b26a5361153006224fdc",
                            "imageTags": [
                                "latest"
                            ],
                            "platform": "CENTOS_8",
                            "pushedAt": "2023-04-17T13:34:34-05:00",
                            "registry": "123456789012",
                            "repositoryName": "cdk-hnb659fds-container-assets-123456789012-us-east-1"
                        }
                    },
                    "id": "arn:aws:ecr:us-east-1:123456789012:repository/cdk-hnb659fds-container-assets-123456789012-us-east-1/sha256:65a4aad1156d8a0679537cb78519a17eb7142e05a968b26a5361153006224fdc",
                    "partition": "aws",
                    "region": "us-east-1",
                    "tags": {},
                    "type": "AWS_ECR_CONTAINER_IMAGE"
                }
            ],
            "severity": "MEDIUM",
            "status": "CLOSED",
            "title": "CVE-2021-22923 - curl, libcurl-minimal",
            "type": "PACKAGE_VULNERABILITY",
            "updatedAt": "2023-04-17T13:36:44.258000-05:00"
        },
...
```
