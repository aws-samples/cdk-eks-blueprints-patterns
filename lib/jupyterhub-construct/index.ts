import { Construct } from 'constructs';
import * as blueprints from '@aws-quickstart/eks-blueprints';

import * as cdk from 'aws-cdk-lib';

export default class JupyterHubConstruct {
    constructor(scope: Construct, id: string) {
        const stackId = `${id}-blueprint`;  

        const hostedZoneName = blueprints.utils.valueFromContext(scope, "hosted-zone-name", "example.com");
        const jupyterHubDomain = blueprints.utils.valueFromContext(scope, "jupyterhub-name", "jupyterhub.example.com");
        const certificateArn = blueprints.utils.valueFromContext(scope, "certificateArn","arn:aws:acm:us-east-1:123456789012:certificate/abcdefwelfjli3991k3lkj5k3")

        blueprints.EksBlueprint.builder()
            .account(process.env.CDK_DEFAULT_ACCOUNT!)
            .region(process.env.CDK_DEFAULT_REGION!)
            .resourceProvider(hostedZoneName, new blueprints.LookupHostedZoneProvider(hostedZoneName))
            .resourceProvider(blueprints.GlobalResources.Certificate, 
                new blueprints.ImportCertificateProvider(certificateArn, hostedZoneName),
            )
            .addOns(
                new blueprints.AwsLoadBalancerControllerAddOn(),
                new blueprints.ExternalDnsAddOn({
                    hostedZoneResources: [hostedZoneName]
                }),
                new blueprints.EfsCsiDriverAddOn,
                new blueprints.ClusterAutoScalerAddOn,
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
                    enableIngress: true,
                    ingressHosts: [jupyterHubDomain],
                    ingressAnnotations: {
                        'alb.ingress.kubernetes.io/certificate-arn': `${certificateArn}`,
                        'alb.ingress.kubernetes.io/listen-ports': '[{"HTTP": 80},{"HTTPS":443}]',
                        'alb.ingress.kubernetes.io/scheme': 'internet-facing',
                        'alb.ingress.kubernetes.io/ssl-redirect': '443',
                        'alb.ingress.kubernetes.io/target-type': 'ip',
                        'external-dns.alpha.kubernetes.io/hostname': `${jupyterHubDomain}`,
                        'kubernetes.io/ingress.class': 'alb',
                    },
                })
            )
            .build(scope, stackId, {}); 
    }
}
  