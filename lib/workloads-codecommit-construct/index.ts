import * as blueprints from '@aws-quickstart/eks-blueprints';
import { Construct } from 'constructs';
import WorkloadsCodeCommitRepoStack from './workloads-codecommit-repo-stack';

/**
 * Demonstrates how to use AWS CodeCommmit as a repository for ArgoCD workloads.
 */

export default class WorkloadsCodeCommitConstruct extends Construct {
    constructor(scope: Construct, id: string) {
        super(scope, id);

        const region = process.env.CDK_DEFAULT_REGION!;

        const userName = 'argocd-cc';
        const repoName = 'eks-blueprints-workloads-cc';

        const repoUrl = 'https://git-codecommit.' + region + '.amazonaws.com/v1/repos/' + repoName;

        const stackId = `${id}-blueprint`;

        const bootstrapRepo : blueprints.ApplicationRepository = {
            repoUrl,
            targetRevision: 'main',
            credentialsSecretName: repoName + '-codecommit-secret',
            credentialsType: 'TOKEN'
        };

        const addOns: Array<blueprints.ClusterAddOn> = [
            new blueprints.NestedStackAddOn({
                builder: WorkloadsCodeCommitRepoStack.builder(userName, repoName),
                id: repoName + "-codecommit-repo-nested-stack"
            }),
            new blueprints.SecretsStoreAddOn,
            new blueprints.ArgoCDAddOn({
                bootstrapRepo: {
                    ...bootstrapRepo,
                    path: 'envs/dev'
                },
                values: {
                    server: {
                        service: {
                            type: "LoadBalancer"
                        }
                    }
                }
            })
        ];

        blueprints.EksBlueprint.builder()
            .account(process.env.CDK_DEFAULT_ACCOUNT!)
            .region(process.env.CDK_DEFAULT_REGION)
            .addOns(...addOns)

            .version('auto')
            .build(scope, stackId);
    }
}
