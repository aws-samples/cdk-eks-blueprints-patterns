import { ArnPrincipal } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { ApplicationTeam, GenerateSecretManagerProvider } from '@aws-quickstart/eks-blueprints';

function getUserArns(scope: Construct, key: string): ArnPrincipal[] {
    const context: string = scope.node.tryGetContext(key);
    if (context) {
        return context.split(",").map(e => new ArnPrincipal(e));
    }
    return [];
}

export class TeamBurnhamSetup extends ApplicationTeam {
    constructor(scope: Construct, teamManifestDir: string) {
        super({
            name: "burnham",
            users: getUserArns(scope, "team-burnham.users"),
            namespaceAnnotations: {
                "appmesh.k8s.aws/sidecarInjectorWebhook": "enabled"
            },
            teamSecrets: [
                {
                    secretProvider: new GenerateSecretManagerProvider('auth-password-id','AuthPassword' + (+new Date())),
                    kubernetesSecret: {
                        secretName: 'auth-password',
                        data: [
                            {
                                key: 'password'
                            }
                        ]
                    }
                }
            ],
            teamManifestDir: teamManifestDir
        });
    }
}