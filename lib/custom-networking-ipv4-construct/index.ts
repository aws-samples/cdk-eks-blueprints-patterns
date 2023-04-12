
import { Construct } from 'constructs';
import * as blueprints from '@aws-quickstart/eks-blueprints'
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { KubernetesVersion, NodegroupAmiType } from 'aws-cdk-lib/aws-eks';
import * as eks from "aws-cdk-lib/aws-eks";
import { VpcProvider } from '@aws-quickstart/eks-blueprints';


export default class CustomNetworkingIPv4Construct {
    constructor(scope: Construct, id: string) {
        const stackId = `${id}-blueprint`;
        
        const clusterProvider = new blueprints.GenericClusterProvider({
            version: KubernetesVersion.V1_24,
            endpointAccess: eks.EndpointAccess.PUBLIC_AND_PRIVATE,
            managedNodeGroups: [
                {
                    id: "mng1",
                    amiType: NodegroupAmiType.AL2_X86_64,
                    instanceTypes: [new ec2.InstanceType('m5.large')],
                    minSize: 2,
                    desiredSize: 2,
                    maxSize: 3,
                    nodeGroupSubnets: { subnetType: ec2.SubnetType.PUBLIC },
                    launchTemplate: {
                        // You can pass Custom Tags to Launch Templates which gets Propogated to worker nodes.
                        customTags: {
                            "Name": "mng-custom-nw-large-al2",
                            "Type": "Managed-Node-Group",
                            "LaunchTemplate": "Custom",
                            "Instance": "ONDEMAND"
                        }
                    }
                }
            ]
        });        
        
const vpcCniAddOn = new blueprints.addons.VpcCniAddOn({
  customNetworkingConfig: {
      subnets: [
          blueprints.getNamedResource("subnet-0"),
          blueprints.getNamedResource("subnet-1"),
          blueprints.getNamedResource("subnet-2"),
      ]   
  },
  awsVpcK8sCniCustomNetworkCfg: true,
  eniConfigLabelDef: 'topology.kubernetes.io/zone'
});        
        
        blueprints.EksBlueprint.builder()
            .account(process.env.CDK_DEFAULT_ACCOUNT!)
            .region(process.env.CDK_DEFAULT_REGION)
            .addOns( vpcCniAddOn,
                new blueprints.AwsLoadBalancerControllerAddOn(),
                new blueprints.CoreDnsAddOn()
            ).resourceProvider(blueprints.GlobalResources.Vpc, new VpcProvider(undefined,"100.64.0.0/24",["100.64.0.0/25","100.64.0.128/26","100.64.0.192/26"]))
            .clusterProvider(clusterProvider)
            .build(scope, stackId);
    }
}
