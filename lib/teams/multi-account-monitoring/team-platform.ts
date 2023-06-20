import { ClusterInfo, PlatformTeam } from '@aws-quickstart/eks-blueprints';
import { ArnPrincipal, IRole } from 'aws-cdk-lib/aws-iam';

export class CorePlatformTeam extends PlatformTeam {
    constructor() {
        super({
            name: `team-platform`
        });
    }

    protected getOrCreateRole(clusterInfo: ClusterInfo, users: ArnPrincipal[], roleArn?: string | undefined): IRole | undefined {
        return super.getOrCreateRole(clusterInfo, users, roleArn ?? `arn:aws:iam::${clusterInfo.cluster.stack.account}:role/Admin`);
    }
}