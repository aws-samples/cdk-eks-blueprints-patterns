import * as blueprints from "@aws-quickstart/eks-blueprints";
import * as eks from "aws-cdk-lib/aws-eks";
import { Construct } from "constructs";

export default class WindowsConstruct {
    build(scope: Construct, id: string) {
        const stackID = `${id}-blueprint`;
        const mngProps: blueprints.MngClusterProviderProps = {
            version: eks.KubernetesVersion.of("1.27"),
            amiType: eks.NodegroupAmiType.WINDOWS_CORE_2022_X86_64,
        };
        // const ampWorkspaceName = "blueprints-amp-workspace";
        // const ampWorkspace: CfnWorkspace = blueprints.getNamedResource(ampWorkspaceName)

        const addons: Array<blueprints.ClusterAddOn> = [
            new blueprints.addons.AwsLoadBalancerControllerAddOn(),
            new blueprints.addons.SSMAgentAddOn(),
            new blueprints.addons.VpcCniAddOn(),
            // new blueprints.addons.CertManagerAddOn(), DOES NOT WORK
            new blueprints.addons.KubeStateMetricsAddOn(),
            new blueprints.addons.PrometheusNodeExporterAddOn(),
            new blueprints.addons.AckAddOn({serviceName: blueprints.AckServiceName.EC2}),
            // new blueprints.addons.AdotCollectorAddOn(), NEEDS CERT MANAGER
            // new blueprints.addons.AmpAddOn({ NEEDS ADOT COLLECTOR
            //     ampPrometheusEndpoint: ampWorkspace.attrPrometheusEndpoint
            // }),
            new blueprints.addons.AppMeshAddOn(),
            new blueprints.addons.AwsBatchAddOn(),
            new blueprints.addons.ArgoCDAddOn(),
            new blueprints.addons.CloudWatchLogsAddon({logGroupPrefix: `/aws/eks/${stackID}`}),
        ];

        const teams: Array<blueprints.Team> = [
            new blueprints.BatchEksTeam({
                name: 'batch-a',
                namespace: 'aws-batch',
                envName: 'batch-a-comp-env',
                computeResources: {
                    envType: blueprints.BatchEnvType.EC2,
                    allocationStrategy: blueprints.BatchAllocationStrategy.BEST,
                    priority: 10,
                    minvCpus: 0,
                    maxvCpus: 128,
                    instanceTypes: ["m5"]
                },
                jobQueueName: 'team-a-job-queue',}),
        ]

        blueprints.EksBlueprint.builder()
            .account(process.env.CDK_DEFAULT_ACCOUNT!)
            .region(process.env.CDK_DEFAULT_REGION!)
            .clusterProvider(new blueprints.MngClusterProvider(mngProps))
            // .resourceProvider(ampWorkspaceName, new blueprints.CreateAmpProvider(ampWorkspaceName, ampWorkspaceName))
            .addOns(...addons)
            .teams(...teams)
            .build(scope, stackID);
    }
}
