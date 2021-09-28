import { ClusterInfo } from '@aws-quickstart/ssp-amazon-eks';
import { Team } from '@aws-quickstart/ssp-amazon-eks';

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