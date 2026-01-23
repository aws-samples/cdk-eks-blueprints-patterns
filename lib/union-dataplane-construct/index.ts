import * as cdk from 'aws-cdk-lib';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import * as union from '@unionai/union-eks-blueprints-addon';
import { prevalidateSecrets, getJsonSecret } from '../common/construct-utils';

const BUCKET_PROVIDER_NAME = "union-s3-bucket";

export default class UnionDataplaneConstruct {
    async buildAsync(scope: cdk.App, id: string) {

        await prevalidateSecrets(UnionDataplaneConstruct.name, undefined, "union-client-id", "union-client-secret", "union-secret");
        const unionSecretString = await blueprints.utils.getSecretValue("union-secret", process.env.CDK_DEFAULT_REGION!);

        const unionConfig: union.UnionDataplaneAddOnProps = {
            orgName: getJsonSecret(unionSecretString, "orgName"),
            clientIdSecretName: "union-client-id",
            clientSecretSecretName:"union-client-secret",
            clusterName: getJsonSecret(unionSecretString, "clusterName"),
            s3BucketProviderName: BUCKET_PROVIDER_NAME,
            host: getJsonSecret(unionSecretString, "host"),
        };

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
            .account(process.env.CDK_DEFAULT_ACCOUNT)
            .region(process.env.CDK_DEFAULT_REGION)
            .resourceProvider(BUCKET_PROVIDER_NAME, new blueprints.CreateS3BucketProvider({ name: `union-bucket-${process.env.CDK_DEFAULT_ACCOUNT!}`, id: "union-bucket" }))
            .addOns(...addOns)
            .version('auto')
            .build(scope, stackId);
    }
}


