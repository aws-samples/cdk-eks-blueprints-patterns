import { Construct } from 'constructs';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import { KubeflowAddOn } from 'eks-blueprints-cdk-kubeflow-ext';
import * as amp from 'aws-cdk-lib/aws-aps';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export default class KubeflowConstruct {
    constructor(scope: Construct, id: string) {
        const stackId = `${id}-blueprint`;
        const ampWorkspaceName = "kubeflow-monitoring";
        const ampPrometheusEndpoint = (blueprints.getNamedResource(ampWorkspaceName) as unknown as amp.CfnWorkspace).attrPrometheusEndpoint;

        const mngProps: blueprints.MngClusterProviderProps = {
            version: eks.KubernetesVersion.V1_29,
            instanceTypes: [new ec2.InstanceType("m5.2xlarge")],
            amiType: eks.NodegroupAmiType.AL2_X86_64,
            desiredSize: 2,
            maxSize: 3, 
        };

        blueprints.EksBlueprint.builder()
            .account(process.env.CDK_DEFAULT_ACCOUNT!)
            .region(process.env.CDK_DEFAULT_REGION)
            .resourceProvider(ampWorkspaceName, new blueprints.CreateAmpProvider(ampWorkspaceName, ampWorkspaceName))
            .addOns( 
                new blueprints.AwsLoadBalancerControllerAddOn(),
                new blueprints.ClusterAutoScalerAddOn(),
                new blueprints.VpcCniAddOn(),
                new blueprints.CoreDnsAddOn(),
                new blueprints.KubeProxyAddOn(),
                new blueprints.EbsCsiDriverAddOn(),
                new blueprints.CertManagerAddOn(),
                new blueprints.KubeStateMetricsAddOn(),
                new blueprints.MetricsServerAddOn(),
                new blueprints.PrometheusNodeExporterAddOn(),
                new blueprints.addons.IstioBaseAddOn({
                    version: "1.18.2"
                }),
                new blueprints.addons.IstioControlPlaneAddOn({
                    version: "1.18.2"
                }),
                new blueprints.addons.IstioIngressGatewayAddon({
                    version: "1.18.2"
                }),
                new blueprints.addons.IstioCniAddon({
                    version: "1.18.2"
                }),
                new blueprints.AdotCollectorAddOn(),
                new blueprints.addons.AmpAddOn({
                    ampPrometheusEndpoint: ampPrometheusEndpoint,
                }),
                new KubeflowAddOn({
                    namespace: 'kubeflow-pipelines'
                })
            )
            .clusterProvider(new blueprints.MngClusterProvider(mngProps))
            .version('auto')
            .build(scope, stackId);
    }
}
