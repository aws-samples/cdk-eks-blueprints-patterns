"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamTroiSetup = void 0;
const cdk = require("@aws-cdk/core");
const s3 = require("@aws-cdk/aws-s3");
class TeamTroiSetup {
    constructor() {
        this.name = 'team-troi';
    }
    setup(clusterInfo) {
        const cluster = clusterInfo.cluster;
        const stack = cluster.stack;
        const namespace = cluster.addManifest(this.name, {
            apiVersion: 'v1',
            kind: 'Namespace',
            metadata: {
                name: this.name,
                annotations: { "argocd.argoproj.io/sync-wave": "-1" }
            }
        });
        this.setupNamespacePolicies(cluster);
        const sa = cluster.addServiceAccount('inf-backend', { name: 'inf-backend', namespace: this.name });
        sa.node.addDependency(namespace);
        const bucket = new s3.Bucket(stack, 'inf-backend-bucket');
        bucket.grantReadWrite(sa);
        new cdk.CfnOutput(stack, this.name + '-sa-iam-role', { value: sa.role.roleArn });
    }
    setupNamespacePolicies(cluster) {
        const quotaName = this.name + "-quota";
        cluster.addManifest(quotaName, {
            apiVersion: 'v1',
            kind: 'ResourceQuota',
            metadata: { name: quotaName },
            spec: {
                hard: {
                    'requests.cpu': '10',
                    'requests.memory': '10Gi',
                    'limits.cpu': '20',
                    'limits.memory': '20Gi'
                }
            }
        });
    }
}
exports.TeamTroiSetup = TeamTroiSetup;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxxQ0FBcUM7QUFFckMsc0NBQXNDO0FBSXRDLE1BQWEsYUFBYTtJQUExQjtRQUNhLFNBQUksR0FBVyxXQUFXLENBQUM7SUF1Q3hDLENBQUM7SUFyQ0csS0FBSyxDQUFDLFdBQXdCO1FBQzFCLE1BQU0sT0FBTyxHQUFHLFdBQVcsQ0FBQyxPQUFPLENBQUM7UUFDcEMsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQztRQUM1QixNQUFNLFNBQVMsR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUU7WUFDN0MsVUFBVSxFQUFFLElBQUk7WUFDaEIsSUFBSSxFQUFFLFdBQVc7WUFDakIsUUFBUSxFQUFFO2dCQUNOLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtnQkFDZixXQUFXLEVBQUUsRUFBRSw4QkFBOEIsRUFBRSxJQUFJLEVBQUU7YUFDeEQ7U0FDSixDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsc0JBQXNCLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFckMsTUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLGFBQWEsRUFBRSxFQUFFLElBQUksRUFBRSxhQUFhLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQ25HLEVBQUUsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ2pDLE1BQU0sTUFBTSxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztRQUMxRCxNQUFNLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQzFCLElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLElBQUksR0FBRyxjQUFjLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFBO0lBQ3BGLENBQUM7SUFFRCxzQkFBc0IsQ0FBQyxPQUFvQjtRQUN2QyxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsSUFBSSxHQUFHLFFBQVEsQ0FBQztRQUN2QyxPQUFPLENBQUMsV0FBVyxDQUFDLFNBQVMsRUFBRTtZQUMzQixVQUFVLEVBQUUsSUFBSTtZQUNoQixJQUFJLEVBQUUsZUFBZTtZQUNyQixRQUFRLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFO1lBQzdCLElBQUksRUFBRTtnQkFDRixJQUFJLEVBQUU7b0JBQ0YsY0FBYyxFQUFFLElBQUk7b0JBQ3BCLGlCQUFpQixFQUFFLE1BQU07b0JBQ3pCLFlBQVksRUFBRSxJQUFJO29CQUNsQixlQUFlLEVBQUUsTUFBTTtpQkFDMUI7YUFDSjtTQUNKLENBQUMsQ0FBQTtJQUNOLENBQUM7Q0FDSjtBQXhDRCxzQ0F3Q0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnQGF3cy1jZGsvY29yZSc7XG5pbXBvcnQgKiBhcyBla3MgZnJvbSBcIkBhd3MtY2RrL2F3cy1la3NcIjtcbmltcG9ydCAqIGFzIHMzIGZyb20gXCJAYXdzLWNkay9hd3MtczNcIjtcblxuaW1wb3J0IHsgQ2x1c3RlckluZm8sIFRlYW0gfSBmcm9tICdAYXdzLXF1aWNrc3RhcnQvc3NwLWFtYXpvbi1la3MnO1xuXG5leHBvcnQgY2xhc3MgVGVhbVRyb2lTZXR1cCBpbXBsZW1lbnRzIFRlYW0ge1xuICAgIHJlYWRvbmx5IG5hbWU6IHN0cmluZyA9ICd0ZWFtLXRyb2knO1xuXG4gICAgc2V0dXAoY2x1c3RlckluZm86IENsdXN0ZXJJbmZvKSB7XG4gICAgICAgIGNvbnN0IGNsdXN0ZXIgPSBjbHVzdGVySW5mby5jbHVzdGVyO1xuICAgICAgICBjb25zdCBzdGFjayA9IGNsdXN0ZXIuc3RhY2s7XG4gICAgICAgIGNvbnN0IG5hbWVzcGFjZSA9IGNsdXN0ZXIuYWRkTWFuaWZlc3QodGhpcy5uYW1lLCB7XG4gICAgICAgICAgICBhcGlWZXJzaW9uOiAndjEnLFxuICAgICAgICAgICAga2luZDogJ05hbWVzcGFjZScsXG4gICAgICAgICAgICBtZXRhZGF0YToge1xuICAgICAgICAgICAgICAgIG5hbWU6IHRoaXMubmFtZSxcbiAgICAgICAgICAgICAgICBhbm5vdGF0aW9uczogeyBcImFyZ29jZC5hcmdvcHJvai5pby9zeW5jLXdhdmVcIjogXCItMVwiIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5zZXR1cE5hbWVzcGFjZVBvbGljaWVzKGNsdXN0ZXIpO1xuXG4gICAgICAgIGNvbnN0IHNhID0gY2x1c3Rlci5hZGRTZXJ2aWNlQWNjb3VudCgnaW5mLWJhY2tlbmQnLCB7IG5hbWU6ICdpbmYtYmFja2VuZCcsIG5hbWVzcGFjZTogdGhpcy5uYW1lIH0pO1xuICAgICAgICBzYS5ub2RlLmFkZERlcGVuZGVuY3kobmFtZXNwYWNlKTtcbiAgICAgICAgY29uc3QgYnVja2V0ID0gbmV3IHMzLkJ1Y2tldChzdGFjaywgJ2luZi1iYWNrZW5kLWJ1Y2tldCcpO1xuICAgICAgICBidWNrZXQuZ3JhbnRSZWFkV3JpdGUoc2EpO1xuICAgICAgICBuZXcgY2RrLkNmbk91dHB1dChzdGFjaywgdGhpcy5uYW1lICsgJy1zYS1pYW0tcm9sZScsIHsgdmFsdWU6IHNhLnJvbGUucm9sZUFybiB9KVxuICAgIH1cblxuICAgIHNldHVwTmFtZXNwYWNlUG9saWNpZXMoY2x1c3RlcjogZWtzLkNsdXN0ZXIpIHtcbiAgICAgICAgY29uc3QgcXVvdGFOYW1lID0gdGhpcy5uYW1lICsgXCItcXVvdGFcIjtcbiAgICAgICAgY2x1c3Rlci5hZGRNYW5pZmVzdChxdW90YU5hbWUsIHtcbiAgICAgICAgICAgIGFwaVZlcnNpb246ICd2MScsXG4gICAgICAgICAgICBraW5kOiAnUmVzb3VyY2VRdW90YScsXG4gICAgICAgICAgICBtZXRhZGF0YTogeyBuYW1lOiBxdW90YU5hbWUgfSxcbiAgICAgICAgICAgIHNwZWM6IHtcbiAgICAgICAgICAgICAgICBoYXJkOiB7XG4gICAgICAgICAgICAgICAgICAgICdyZXF1ZXN0cy5jcHUnOiAnMTAnLFxuICAgICAgICAgICAgICAgICAgICAncmVxdWVzdHMubWVtb3J5JzogJzEwR2knLFxuICAgICAgICAgICAgICAgICAgICAnbGltaXRzLmNwdSc6ICcyMCcsXG4gICAgICAgICAgICAgICAgICAgICdsaW1pdHMubWVtb3J5JzogJzIwR2knXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH1cbn0iXX0=