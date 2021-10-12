"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamRikerSetup = void 0;
class TeamRikerSetup {
    constructor() {
        this.name = 'team-riker';
    }
    setup(clusterInfo) {
        clusterInfo.cluster.addManifest(this.name, {
            apiVersion: 'v1',
            kind: 'Namespace',
            metadata: { name: 'team-riker' }
        });
    }
}
exports.TeamRikerSetup = TeamRikerSetup;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFHQSxNQUFhLGNBQWM7SUFBM0I7UUFFYSxTQUFJLEdBQUcsWUFBWSxDQUFDO0lBU2pDLENBQUM7SUFQRyxLQUFLLENBQUMsV0FBd0I7UUFDMUIsV0FBVyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRTtZQUN2QyxVQUFVLEVBQUUsSUFBSTtZQUNoQixJQUFJLEVBQUUsV0FBVztZQUNqQixRQUFRLEVBQUUsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFO1NBQ25DLENBQUMsQ0FBQztJQUNQLENBQUM7Q0FDSjtBQVhELHdDQVdDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ2x1c3RlckluZm8gfSBmcm9tICdAYXdzLXF1aWNrc3RhcnQvc3NwLWFtYXpvbi1la3MnO1xuaW1wb3J0IHsgVGVhbSB9IGZyb20gJ0Bhd3MtcXVpY2tzdGFydC9zc3AtYW1hem9uLWVrcyc7XG5cbmV4cG9ydCBjbGFzcyBUZWFtUmlrZXJTZXR1cCBpbXBsZW1lbnRzIFRlYW0ge1xuXG4gICAgcmVhZG9ubHkgbmFtZSA9ICd0ZWFtLXJpa2VyJztcblxuICAgIHNldHVwKGNsdXN0ZXJJbmZvOiBDbHVzdGVySW5mbykge1xuICAgICAgICBjbHVzdGVySW5mby5jbHVzdGVyLmFkZE1hbmlmZXN0KHRoaXMubmFtZSwge1xuICAgICAgICAgICAgYXBpVmVyc2lvbjogJ3YxJyxcbiAgICAgICAgICAgIGtpbmQ6ICdOYW1lc3BhY2UnLFxuICAgICAgICAgICAgbWV0YWRhdGE6IHsgbmFtZTogJ3RlYW0tcmlrZXInIH1cbiAgICAgICAgfSk7XG4gICAgfVxufSJdfQ==