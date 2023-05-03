import { Construct } from 'constructs';
import * as blueprints from '@aws-quickstart/eks-blueprints';

import * as cdk from 'aws-cdk-lib';

export default class JupyterHubConstruct {
    constructor(scope: Construct, id: string, props: cdk.StackProps) {
        const stackId = `${id}-blueprint`;  

        blueprints.EksBlueprint.builder()
            .account(props.env!.account!)
            .region(props.env!.region!)
            .addOns(
                new blueprints.EfsCsiDriverAddOn({replicaCount: 1}),
                new blueprints.VpcCniAddOn(),
                new blueprints.KubeProxyAddOn(),
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
                    serviceType: blueprints.JupyterHubServiceType.CLUSTERIP,
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
  