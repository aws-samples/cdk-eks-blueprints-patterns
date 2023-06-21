import { Construct } from 'constructs';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import { BackstageSecretAddOn, BackstageSecretAddOnProps } from './backstage-secret-addon';
import { DatabaseInstanceCredentialsProvider, DatabaseInstanceCredentialsProviderProps } from './database-credentials';
import * as databaseInstanceProvider from './rds-database-instance';

export class BackstageConstruct extends Construct {
    constructor(scope: Construct, id: string) {
        super(scope, id);

        const props = {
            account: process.env.CDK_DEFAULT_ACCOUNT,
            region: process.env.CDK_DEFAULT_REGION,
            namespace: blueprints.utils.valueFromContext(scope, "backstage.namespace.name", "backstage"),
            backstageImageRegistry: blueprints.utils.valueFromContext(scope, "backstage.image.registry.name", "youraccount.dkr.ecr.yourregion.amazonaws.com"),
            backstageImageRepository: blueprints.utils.valueFromContext(scope, "backstage.image.repository.name", "backstage"),
            backstageImageTag: blueprints.utils.valueFromContext(scope, "backstage.image.tag.name", "latest"),
            parentDomain: blueprints.utils.valueFromContext(scope, "backstage.parent.domain.name", "example.com"),
            backstageLabel: blueprints.utils.valueFromContext(scope, "backstage.subdomain.label", "backstage"),
            hostedZoneId: blueprints.utils.valueFromContext(scope, "backstage.hosted.zone.id", "1234"),
            certificateResourceName: blueprints.utils.valueFromContext(scope, "backstage.certificate.resource.name", "backstage-certificate"),
            databaseResourceName: blueprints.utils.valueFromContext(scope, "backstage.database.resource.name", "backstage-database"),
            databaseInstancePort: blueprints.utils.valueFromContext(scope, "backstage.database.instance.port", 5432),
            databaseSecretResourceName: blueprints.utils.valueFromContext(scope, "backstage.database.secret.resource.name", "backstage-database-credentials"),
            username: blueprints.utils.valueFromContext(scope, "backstage.database.username", "postgres"),
            databaseSecretTargetName: blueprints.utils.valueFromContext(scope, "backstage.database.secret.target.name", "backstage-database-secret"),
        };

        const subdomain = props.backstageLabel+"."+props.parentDomain;
    
        const databaseInstanceCredentialsProviderProps = {
            username: props.username
        } as DatabaseInstanceCredentialsProviderProps;

        const databaseInstanceProps = {
            vpcResourceName: blueprints.GlobalResources.Vpc,
            databaseInstancePort: props.databaseInstancePort,
            databaseSecretResourceName: props.databaseSecretResourceName
        } as databaseInstanceProvider.DatabaseInstanceProviderProps;

        const backstageSecretAddOnProps = {
            namespace: props.namespace,
            databaseSecretResourceName: props.databaseSecretResourceName,
            databaseSecretTargetName: props.databaseSecretTargetName
        } as BackstageSecretAddOnProps;

        const backstageAddOnProps = {
            namespace: props.namespace,
            subdomain: subdomain,
            certificateResourceName: props.certificateResourceName,
            imageRegistry: props.backstageImageRegistry,
            imageRepository: props.backstageImageRepository,
            imageTag: props.backstageImageTag,
            databaseResourceName: props.databaseResourceName,
            databaseSecretTargetName: props.databaseSecretTargetName
        } as blueprints.BackstageAddOnProps;

        const addOns: Array<blueprints.ClusterAddOn> = [
            new blueprints.CalicoOperatorAddOn(),
            new blueprints.ClusterAutoScalerAddOn(),
            new blueprints.AwsLoadBalancerControllerAddOn(),
            new blueprints.VpcCniAddOn(),
            new blueprints.CoreDnsAddOn(),
            new blueprints.KubeProxyAddOn(),
            new blueprints.ExternalDnsAddOn({
                hostedZoneResources: [blueprints.GlobalResources.HostedZone]
            }),
            new blueprints.addons.ExternalsSecretsAddOn({}),
            new BackstageSecretAddOn(backstageSecretAddOnProps),
            new blueprints.BackstageAddOn(backstageAddOnProps)
        ];

        blueprints.EksBlueprint.builder()
            .account(props.account)
            .region(props.region)
            .resourceProvider(blueprints.GlobalResources.Vpc, new blueprints.VpcProvider())
            .resourceProvider(blueprints.GlobalResources.HostedZone, new blueprints.ImportHostedZoneProvider(props.hostedZoneId, props.parentDomain))
            .resourceProvider(props.certificateResourceName, new blueprints.CreateCertificateProvider("elb-certificate", subdomain, blueprints.GlobalResources.HostedZone))
            .resourceProvider(props.databaseSecretResourceName, new DatabaseInstanceCredentialsProvider(databaseInstanceCredentialsProviderProps))
            .resourceProvider(props.databaseResourceName, new databaseInstanceProvider.DatabaseInstanceProvider(databaseInstanceProps))
            .addOns(...addOns)
            .teams()
            .build(scope, props.backstageLabel+"-blueprint");
    }
}
