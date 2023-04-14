# Amazon ECR Image Scanning

## Objective

The objective of this pattern is to demonstrate how to enable and configure Amazon ECR image scanning.

The following scanning types are offered.

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
  - `enchancedScanRules` - the scanning rules.
- Basic scanning only:
  - `basicScanRules` - the scanning rules.

Please refer to the [Amazon ECR Image Scanning](https://docs.aws.amazon.com/AmazonECR/latest/userguide/image-scanning.html) documentation for more information and how to use filters.

## GitOps confguration

TBD

## Prerequisites

1. Clone the repository
1. Follow the usage [instructions](README.md#usage) to install the dependencies
1. `argo-admin-password` secret must be defined in Secrets Manager in the same region as the EKS cluster.

## Deploy

### Deploying the `ImageScanningSetupStack` stack

The `ImageScanningSetupStack` configures the Amazon ECR image scanning and the ECR automated re-scan duration in Inspector.

To deploy the stack, run the following command:

```bash
npx cdk deploy image-scanning-setup
```

### Deploying the blueprint

The blueprint deploys a sample GitOps workload that pushes images to Amazon ECR and triggers the image scanning.

To deploy the bluepring, run the following command:

```bash
npx cdk deploy image-scanning-workload-blueprint
```

## Verify
