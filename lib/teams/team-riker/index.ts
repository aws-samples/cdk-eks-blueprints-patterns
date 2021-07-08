import { ClusterInfo } from '@shapirov/cdk-eks-blueprint';
import { Team } from '@shapirov/cdk-eks-blueprint';

export class TeamRikerSetup implements Team {

    readonly name = 'team-riker';

    setup(clusterInfo: ClusterInfo) {
        clusterInfo.cluster.addManifest(this.name, {
            apiVersion: 'v1',
            kind: 'Namespace',
            metadata: { name: 'team-riker' }
        });
    }
}