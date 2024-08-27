import { Construct } from 'constructs';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import { ArnPrincipal } from 'aws-cdk-lib/aws-iam'; 
import { NagSuppressionsConfig } from './nag-rules';
import { KubernetesVersion } from 'aws-cdk-lib/aws-eks';


export default class CdkNagConstruct {

    constructor(scope: Construct, id: string, account: string) {
        const stackId = `${id}-blueprint`;

        const addOns: Array<blueprints.ClusterAddOn> = [
            new blueprints.addons.SSMAgentAddOn(),
            new blueprints.addons.CoreDnsAddOn('auto'),
            new blueprints.addons.KubeProxyAddOn("v1.29.1-eksbuild.2"),
            new blueprints.addons.EbsCsiDriverAddOn(),
        ];

        const applicationTeams: Array<EKSaaPApplicationTeam> = [
            new EKSaaPApplicationTeam("one", [
                new ArnPrincipal(`arn:aws:iam::${account}:role/its-user`)
            ]),
            new EKSaaPApplicationTeam("two", [
                new ArnPrincipal(`arn:aws:iam::${account}:role/its-user`)
            ])
        ];

        const platformTeam = new EKSaaPPlatformTeam([
            new ArnPrincipal(`arn:aws:iam::${account}:role/its-admin`)
        ]);

        const promise = blueprints.EksBlueprint.builder()
            .addOns(...addOns)
            .version(KubernetesVersion.V1_29)
            .teams(platformTeam, ...applicationTeams)
            .useDefaultSecretEncryption(true)
            .compatibilityMode(true)
            .buildAsync(scope, stackId);

        promise.then(stack => new NagSuppressionsConfig(stack));
    }
}

export class EKSaaPPlatformTeam extends blueprints.PlatformTeam {
    constructor(
        allowedArnPrincipals: Array<ArnPrincipal>,
        name?: string
    ) {
        super({
            name: name ?? "infrastructure",
            users: allowedArnPrincipals
        });
    }
}

export class EKSaaPApplicationTeam extends blueprints.ApplicationTeam {
    constructor(
        name: string,
        allowedArnPrincipals: Array<ArnPrincipal>,
        namespace?: string
    ) {
        super({
            name,
            namespace,
            users: allowedArnPrincipals
        });
    }
}