import { Construct } from 'constructs';

// Blueprints Lib
import * as blueprints from '@aws-quickstart/eks-blueprints';
import { cloudWatchDeploymentMode } from '@aws-quickstart/eks-blueprints';

// Team implementation
import * as team from '../teams/multi-account-monitoring';

/**
 * Demonstration of how to use CloudWatch Adot add-on.
 */
export default class CloudWatchMonitoringConstruct {
    
    build(scope: Construct, id: string, account?: string, region?: string ) {
        // Setup platform team
        const accountID = account ?? process.env.CDK_DEFAULT_ACCOUNT! ;
        const awsRegion =  region ?? process.env.CDK_DEFAULT_REGION! ;
 
        const stackID = `${id}-blueprint`;
        this.create(scope, accountID, awsRegion)
            .build(scope, stackID);
    }

    create(scope: Construct, account?: string, region?: string ) {
        // Setup platform team
        const accountID = account ?? process.env.CDK_DEFAULT_ACCOUNT! ;
        const awsRegion =  region ?? process.env.CDK_DEFAULT_REGION! ;

        const cloudWatchAdotAddOn = new blueprints.addons.CloudWatchAdotAddOn({
            deploymentMode: cloudWatchDeploymentMode.DEPLOYMENT,
            namespace: 'default',
            name: 'adot-collector-cloudwatch',
            metricsNameSelectors: ['apiserver_request_.*', 'container_memory_.*', 'container_threads', 'otelcol_process_.*', 'ho11y*'],
            podLabelRegex: 'frontend|downstream(.*)' 
        });

        return blueprints.EksBlueprint.builder()
            .account(accountID)
            .region(awsRegion)
            .addOns(
                new blueprints.AwsLoadBalancerControllerAddOn,
                new blueprints.CertManagerAddOn,
                new blueprints.KubeStateMetricsAddOn,
                new blueprints.PrometheusNodeExporterAddOn,
                new blueprints.AdotCollectorAddOn,
                cloudWatchAdotAddOn,
                new blueprints.XrayAdotAddOn,
                new blueprints.NginxAddOn,
                new blueprints.ClusterAutoScalerAddOn,
                new blueprints.SecretsStoreAddOn
            )
            .teams(new team.TeamGeordi, new team.CorePlatformTeam);
    }
}


