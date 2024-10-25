
import { Construct } from 'constructs';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { KubernetesVersion, NodegroupAmiType } from 'aws-cdk-lib/aws-eks';
import * as eks from "aws-cdk-lib/aws-eks";

export default class CustomNetworkingIPv4Construct {
    constructor(scope: Construct, id: string) {
        const stackId = `${id}-blueprint`;

        const mngProps = {
            version: KubernetesVersion.V1_25,
            endpointAccess: eks.EndpointAccess.PUBLIC_AND_PRIVATE,
            instanceTypes: [new ec2.InstanceType('m5.large')],
            amiType: NodegroupAmiType.AL2_X86_64,
            desiredSize: 2,
            maxSize: 3,
            vpcSubnets: [{ subnetType: ec2.SubnetType.PUBLIC }]
        };


        const clusterProvider = new blueprints.MngClusterProvider(mngProps);

        blueprints.EksBlueprint.builder()
            .account(process.env.CDK_DEFAULT_ACCOUNT!)
            .region(process.env.CDK_DEFAULT_REGION)
            .addOns(new blueprints.VpcCniAddOn({
                customNetworkingConfig: {
                    subnets: [
                        blueprints.getNamedResource("secondary-cidr-subnet-0"),
                        blueprints.getNamedResource("secondary-cidr-subnet-1"),
                        blueprints.getNamedResource("secondary-cidr-subnet-2"),
                    ]
                },
                awsVpcK8sCniCustomNetworkCfg: true,
                eniConfigLabelDef: 'topology.kubernetes.io/zone'
            }),
            new blueprints.AwsLoadBalancerControllerAddOn(),
            new blueprints.CoreDnsAddOn(),
            new blueprints.KubeProxyAddOn(),
            )
            .resourceProvider(blueprints.GlobalResources.Vpc, new blueprints.VpcProvider(undefined, {
                primaryCidr: "10.2.0.0/16",
                secondaryCidr: "100.64.0.0/16",
                secondarySubnetCidrs: ["100.64.0.0/24", "100.64.1.0/24", "100.64.2.0/24"]
            }))

            .clusterProvider(clusterProvider)
            .build(scope, stackId);
    }
}
