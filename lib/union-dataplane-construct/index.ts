import * as cdk from 'aws-cdk-lib'
import * as blueprints from '@aws-quickstart/eks-blueprints';
import * as union from '@unionai/union-eks-blueprints-addon'
import { prevalidateSecrets } from '../common/construct-utils';

const BUCKET_PROVIDER_NAME = "union-s3-bucket"

export default class UnionDataplaneConstruct {
  async buildAsync(scope: cdk.App, id: string) {
    let unionConfig: union.UnionDataplaneAddOnProps = {
      orgName: blueprints.utils.valueFromContext(scope, "union.orgName", "your-org"),
      clientIdSecretName: blueprints.utils.valueFromContext(scope, "union.secrets.clientId", "union-client-id"),
      clientSecretSecretName: blueprints.utils.valueFromContext(scope, "union.secrets.clientSecret", "union-client-secret"),
      clusterName: blueprints.utils.valueFromContext(scope, "union.clusterName", "your-cluster-name"),
      s3BucketProviderName: BUCKET_PROVIDER_NAME,
      host: blueprints.utils.valueFromContext(scope, "union.host", "your.union.host")
    };

    await prevalidateSecrets(UnionDataplaneConstruct.name, undefined, unionConfig.clientIdSecretName, unionConfig.clientSecretSecretName);
    const stackId = `${id}-blueprint`;

    const nodeClassSpec: blueprints.Ec2NodeClassV1Spec = {
      amiFamily: "Bottlerocket",
      amiSelectorTerms: [
        { alias: "bottlerocket@1.50.0" }, // alias allows to specify ami family and version. @latest also supported
      ],
      subnetSelectorTerms: [
        { tags: { Name: `${stackId}/${stackId}-vpc/PrivateSubnet*` } },
      ],
      securityGroupSelectorTerms: [
        { tags: { "aws:eks:cluster-name": `${stackId}` } },
      ],
    };

    const nodePoolSpec: blueprints.NodePoolV1Spec = {
      labels: { type: "karpenter-test" },
      requirements: [
        { key: "node.kubernetes.io/instance-type", operator: "In", values: ["m5.2xlarge", "m5.xlarge"] },
        {
          key: "topology.kubernetes.io/zone",
          operator: "In",
          values: [`${process.env.CDK_DEFAULT_REGION}a`, `${process.env.CDK_DEFAULT_REGION}b`],
        },
        { key: "kubernetes.io/arch", operator: "In", values: ["amd64"] },
        { key: "karpenter.sh/capacity-type", operator: "In", values: ["on-demand"] },
      ],
      expireAfter: "20m",
      disruption: { consolidationPolicy: "WhenEmpty", consolidateAfter: "30s" },
      limits: { cpu: 400 }
    };


    const addOns: Array<blueprints.ClusterAddOn> = [
      new blueprints.addons.MetricsServerAddOn,
      new blueprints.addons.VpcCniAddOn,
      new blueprints.addons.KubeProxyAddOn,
      new blueprints.addons.CoreDnsAddOn,
      new blueprints.addons.EksPodIdentityAgentAddOn,
      new blueprints.addons.KarpenterV1AddOn({
        ec2NodeClassSpec: nodeClassSpec,
        nodePoolSpec: nodePoolSpec,
        interruptionHandling: true,
        podIdentity: true
      }),
      new union.UnionDataplaneCRDsAddOn,
      new union.UnionDataplaneAddOn(unionConfig)
    ];
    blueprints.EksBlueprint.builder()
      .account(process.env.CDK_DEFAULT_ACCOUNT!)
      .region(process.env.CDK_DEFAULT_REGION)
      .resourceProvider(BUCKET_PROVIDER_NAME, new blueprints.CreateS3BucketProvider({ name: `union-bucket-${process.env.CDK_DEFAULT_ACCOUNT!}`, id: "union-bucket" }))
      .addOns(...addOns)
      .version('auto')
      .build(scope, stackId);
  }
}


