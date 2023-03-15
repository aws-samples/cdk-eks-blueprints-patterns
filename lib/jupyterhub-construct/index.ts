import { Construct } from 'constructs';
import { GlobalResources, utils, DelegatingHostedZoneProvider } from '@aws-quickstart/eks-blueprints';
import * as blueprints from '@aws-quickstart/eks-blueprints';

import * as cdk from 'aws-cdk-lib';

export default class JupyterHubConstruct {
    constructor(scope: Construct, id: string, props: cdk.StackProps) {
        const stackId = `${id}-blueprint`;  

        const subdomain: string = utils.valueFromContext(scope, "dev.subzone.name", "dev.some.example.com");
        const parentDnsAccountId = scope.node.tryGetContext("parent.dns.account")!;
        const parentDomain = utils.valueFromContext(scope, "parent.hostedzone.name", "some.example.com");
        const jupyterhubDomain = utils.valueFromContext(scope, "jupyterhub.subzone.name", "jupyterhub.dev.some.example.com");
        const certificateArn = utils.valueFromContext(scope, "certificateArn","arn:aws:acm:us-east-1:123456789012:certificate/abcdefwelfjli3991k3lkj5k3")

        blueprints.EksBlueprint.builder()
            .account(props.env!.account!)
            .region(props.env!.region!)
            .resourceProvider(GlobalResources.HostedZone, new DelegatingHostedZoneProvider({
                parentDomain,
                subdomain,
                parentDnsAccountId,
                delegatingRoleName: 'DomainOperatorRole',
                wildcardSubdomain: true
            }))
            .resourceProvider(GlobalResources.Certificate, new blueprints.CreateCertificateProvider('wildcard-cert', `*.${subdomain}`, GlobalResources.HostedZone))
            .addOns(
                new blueprints.AwsLoadBalancerControllerAddOn(),
                new blueprints.ExternalDnsAddOn({
                    hostedZoneResources: [GlobalResources.HostedZone]
                }),
                new blueprints.EbsCsiDriverAddOn(),
                new blueprints.EfsCsiDriverAddOn({replicaCount: 1}),
                new blueprints.ClusterAutoScalerAddOn(),
                new blueprints.JupyterHubAddOn({
                    efsConfig:{
                        removalPolicy: cdk.RemovalPolicy.DESTROY,
                        pvcName: "efs-persist",
                        capacity: "120Gi",
                    },
                    oidcConfig: {
                        callbackUrl: blueprints.utils.valueFromContext(scope, "callbackUrl", "https://www.example.com/hub/oauth_callback"),
                        authUrl: blueprints.utils.valueFromContext(scope, "authUrl", "https://yourid.oidcprovider.com/authorize"),
                        tokenUrl: blueprints.utils.valueFromContext(scope, "tokenUrl", "https://yourid.oidcprovider.com/oauth/token"),
                        userDataUrl: blueprints.utils.valueFromContext(scope, "userDataUrl", "https://yourid.oidcprovider.com/userinfo"),
                        clientId: blueprints.utils.valueFromContext(scope, "clientId", "yourClientIdString"),
                        clientSecret: blueprints.utils.valueFromContext(scope, "clientSecret", "yourClientSecretString"),
                        scope: blueprints.utils.valueFromContext(scope, "scope",["openid","name","profile","email"]),
                        usernameKey: blueprints.utils.valueFromContext(scope, "usernameKey", "name"),
                    },
                    serviceType: blueprints.JupyterHubServiceType.ALB,
                    ingressHosts: [jupyterhubDomain],
                    ingressAnnotations: {
                        'external-dns.alpha.kubernetes.io/hostname': `${jupyterhubDomain}`,
                    },
                    certificateResourceName: GlobalResources.Certificate,
                    values: { 
                        prePuller: { 
                            hook: { enabled: false },
                        }
                    }
                })
            )
            .build(scope, stackId); 
    }
}
  