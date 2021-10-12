"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiRegion = void 0;
require("@aws-cdk/assert/jest");
const cdk = require("@aws-cdk/core");
const assert_1 = require("@aws-cdk/assert");
const multi_region_construct_1 = require("../lib/multi-region-construct");
class MultiRegion extends cdk.Stack {
    constructor(scope, id) {
        super(scope, id);
        new multi_region_construct_1.default().buildAsync(app, 'multi-region').catch(() => {
            console.log("Multi region pattern is not setup due to missing secrets for GitHub access and ArgoCD admin pwd.");
        });
    }
}
exports.MultiRegion = MultiRegion;
test('Test', () => {
    // GIVEN
    const app = new cdk.App();
    const env = {
        region: app.node.tryGetContext('region') || process.env.CDK_DEFAULT_REGION || 'eu-west-1',
        account: app.node.tryGetContext('account') || process.env.CDK_DEFAULT_ACCOUNT || 'xxxxxxxxxxxx',
    };
    // WHEN
    const stack = new MultiRegion(app, 'multi-region');
    //const stack = new MyStack(app, 'test');
    // THEN
    //Finally Check Snapshot
    expect(assert_1.SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
    // expect(stack).not.toHaveResource('AWS::S3::Bucket');
    // expect(app.synth().getStackArtifact(stack.artifactId).template).toMatchSnapshot();
    expect(stack).toHaveResource('AWS::EC2::VPC', {
        EnableDnsSupport: true,
        CidrBlock: '10.0.0.0/16',
        Tags: [
            {
                Key: 'Name',
                Value: 'Casskop/Vpc',
            },
        ],
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXVsdGktcmVnaW9uLnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJtdWx0aS1yZWdpb24udGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxnQ0FBOEI7QUFDOUIscUNBQXFDO0FBQ3JDLDRDQUE2QztBQUM3QywwRUFBaUU7QUFHakUsTUFBYSxXQUFZLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDeEMsWUFBWSxLQUFvQixFQUFFLEVBQVU7UUFDMUMsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztRQUdyQixJQUFJLGdDQUFvQixFQUFFLENBQUMsVUFBVSxDQUFDLEdBQUcsRUFBRSxjQUFjLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFO1lBQ2xFLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0dBQWtHLENBQUMsQ0FBQztRQUNwSCxDQUFDLENBQUMsQ0FBQztJQUNELENBQUM7Q0FDRjtBQVRELGtDQVNDO0FBRUQsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUU7SUFDaEIsUUFBUTtJQUNSLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBQzFCLE1BQU0sR0FBRyxHQUFHO1FBQ1YsTUFBTSxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLElBQUksV0FBVztRQUN6RixPQUFPLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsSUFBSSxjQUFjO0tBQ2hHLENBQUM7SUFHRixPQUFPO0lBQ1AsTUFBTSxLQUFLLEdBQUcsSUFBSSxXQUFXLENBQUMsR0FBRyxFQUFFLGNBQWMsQ0FBQyxDQUFDO0lBQ25ELHlDQUF5QztJQUV6QyxPQUFPO0lBQ0wsd0JBQXdCO0lBQzFCLE1BQU0sQ0FBQyxtQkFBVSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUM7SUFFN0QsdURBQXVEO0lBQ3ZELHFGQUFxRjtJQUVyRixNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsY0FBYyxDQUFDLGVBQWUsRUFBRTtRQUM1QyxnQkFBZ0IsRUFBRSxJQUFJO1FBQ3RCLFNBQVMsRUFBRSxhQUFhO1FBQ3hCLElBQUksRUFBRTtZQUNKO2dCQUNFLEdBQUcsRUFBRSxNQUFNO2dCQUNYLEtBQUssRUFBRSxhQUFhO2FBQ3JCO1NBQ0Y7S0FDRixDQUFDLENBQUM7QUFFTCxDQUFDLENBQUEsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAnQGF3cy1jZGsvYXNzZXJ0L2plc3QnO1xuaW1wb3J0ICogYXMgY2RrIGZyb20gJ0Bhd3MtY2RrL2NvcmUnO1xuaW1wb3J0IHsgU3ludGhVdGlscyB9IGZyb20gJ0Bhd3MtY2RrL2Fzc2VydCc7XG5pbXBvcnQgTXVsdGlSZWdpb25Db25zdHJ1Y3QgZnJvbSAnLi4vbGliL211bHRpLXJlZ2lvbi1jb25zdHJ1Y3QnO1xuXG5cbmV4cG9ydCBjbGFzcyBNdWx0aVJlZ2lvbiBleHRlbmRzIGNkay5TdGFjayB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBjZGsuQ29uc3RydWN0LCBpZDogc3RyaW5nKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkKTtcblxuICAgXG5uZXcgTXVsdGlSZWdpb25Db25zdHJ1Y3QoKS5idWlsZEFzeW5jKGFwcCwgJ211bHRpLXJlZ2lvbicpLmNhdGNoKCgpID0+IHtcbiAgICBjb25zb2xlLmxvZyhcIk11bHRpIHJlZ2lvbiBwYXR0ZXJuIGlzIG5vdCBzZXR1cCBkdWUgdG8gbWlzc2luZyBzZWNyZXRzIGZvciBHaXRIdWIgYWNjZXNzIGFuZCBBcmdvQ0QgYWRtaW4gcHdkLlwiKTtcbn0pO1xuICB9XG59XG5cbnRlc3QoJ1Rlc3QnLCAoKSA9PiB7XG4gIC8vIEdJVkVOXG4gIGNvbnN0IGFwcCA9IG5ldyBjZGsuQXBwKCk7XG4gIGNvbnN0IGVudiA9IHtcbiAgICByZWdpb246IGFwcC5ub2RlLnRyeUdldENvbnRleHQoJ3JlZ2lvbicpIHx8IHByb2Nlc3MuZW52LkNES19ERUZBVUxUX1JFR0lPTiB8fCAnZXUtd2VzdC0xJyxcbiAgICBhY2NvdW50OiBhcHAubm9kZS50cnlHZXRDb250ZXh0KCdhY2NvdW50JykgfHwgcHJvY2Vzcy5lbnYuQ0RLX0RFRkFVTFRfQUNDT1VOVCB8fCAneHh4eHh4eHh4eHh4JyxcbiAgfTtcblxuXG4gIC8vIFdIRU5cbiAgY29uc3Qgc3RhY2sgPSBuZXcgTXVsdGlSZWdpb24oYXBwLCAnbXVsdGktcmVnaW9uJyk7XG4gIC8vY29uc3Qgc3RhY2sgPSBuZXcgTXlTdGFjayhhcHAsICd0ZXN0Jyk7XG5cbiAgLy8gVEhFTlxuICAgIC8vRmluYWxseSBDaGVjayBTbmFwc2hvdFxuICBleHBlY3QoU3ludGhVdGlscy50b0Nsb3VkRm9ybWF0aW9uKHN0YWNrKSkudG9NYXRjaFNuYXBzaG90KCk7XG5cbiAgLy8gZXhwZWN0KHN0YWNrKS5ub3QudG9IYXZlUmVzb3VyY2UoJ0FXUzo6UzM6OkJ1Y2tldCcpO1xuICAvLyBleHBlY3QoYXBwLnN5bnRoKCkuZ2V0U3RhY2tBcnRpZmFjdChzdGFjay5hcnRpZmFjdElkKS50ZW1wbGF0ZSkudG9NYXRjaFNuYXBzaG90KCk7XG5cbiAgZXhwZWN0KHN0YWNrKS50b0hhdmVSZXNvdXJjZSgnQVdTOjpFQzI6OlZQQycsIHtcbiAgICBFbmFibGVEbnNTdXBwb3J0OiB0cnVlLFxuICAgIENpZHJCbG9jazogJzEwLjAuMC4wLzE2JyxcbiAgICBUYWdzOiBbXG4gICAgICB7XG4gICAgICAgIEtleTogJ05hbWUnLFxuICAgICAgICBWYWx1ZTogJ0Nhc3Nrb3AvVnBjJyxcbiAgICAgIH0sXG4gICAgXSxcbiAgfSk7XG5cbn0iXX0=