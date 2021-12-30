"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NginxIngress = void 0;
require("@aws-cdk/assert/jest");
const cdk = require("@aws-cdk/core");
const assert_1 = require("@aws-cdk/assert");
const nginx_ingress_construct_1 = require("../lib/nginx-ingress-construct");
class NginxIngress extends cdk.Stack {
    constructor(scope, id) {
        super(scope, id);
        new nginx_ingress_construct_1.default(this, 'nginx');
    }
}
exports.NginxIngress = NginxIngress;
test('Test', () => {
    // GIVEN
    const app = new cdk.App();
    const env = {
        region: app.node.tryGetContext('region') || process.env.CDK_DEFAULT_REGION || 'eu-west-1',
        account: app.node.tryGetContext('account') || process.env.CDK_DEFAULT_ACCOUNT || 'xxxxxxxxxxxx',
    };
    // WHEN
    const stack = new NginxIngress(app, 'nginx');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibWFpbi50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLGdDQUE4QjtBQUM5QixxQ0FBcUM7QUFDckMsNENBQTZDO0FBQzdDLDRFQUFtRTtBQUduRSxNQUFhLFlBQWEsU0FBUSxHQUFHLENBQUMsS0FBSztJQUN6QyxZQUFZLEtBQW9CLEVBQUUsRUFBVTtRQUMxQyxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRWpCLElBQUksaUNBQXFCLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFBO0lBQzFDLENBQUM7Q0FDRjtBQU5ELG9DQU1DO0FBRUQsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUU7SUFDaEIsUUFBUTtJQUNSLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBQzFCLE1BQU0sR0FBRyxHQUFHO1FBQ1YsTUFBTSxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLElBQUksV0FBVztRQUN6RixPQUFPLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsSUFBSSxjQUFjO0tBQ2hHLENBQUM7SUFHRixPQUFPO0lBQ1AsTUFBTSxLQUFLLEdBQUcsSUFBSSxZQUFZLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQzdDLHlDQUF5QztJQUV6QyxPQUFPO0lBQ0wsd0JBQXdCO0lBQzFCLE1BQU0sQ0FBQyxtQkFBVSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUM7SUFFN0QsdURBQXVEO0lBQ3ZELHFGQUFxRjtJQUVyRixNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsY0FBYyxDQUFDLGVBQWUsRUFBRTtRQUM1QyxnQkFBZ0IsRUFBRSxJQUFJO1FBQ3RCLFNBQVMsRUFBRSxhQUFhO1FBQ3hCLElBQUksRUFBRTtZQUNKO2dCQUNFLEdBQUcsRUFBRSxNQUFNO2dCQUNYLEtBQUssRUFBRSxhQUFhO2FBQ3JCO1NBQ0Y7S0FDRixDQUFDLENBQUM7QUFFTCxDQUFDLENBQUEsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAnQGF3cy1jZGsvYXNzZXJ0L2plc3QnO1xuaW1wb3J0ICogYXMgY2RrIGZyb20gJ0Bhd3MtY2RrL2NvcmUnO1xuaW1wb3J0IHsgU3ludGhVdGlscyB9IGZyb20gJ0Bhd3MtY2RrL2Fzc2VydCc7XG5pbXBvcnQgTmdpbnhJbmdyZXNzQ29uc3RydWN0IGZyb20gJy4uL2xpYi9uZ2lueC1pbmdyZXNzLWNvbnN0cnVjdCc7XG5cblxuZXhwb3J0IGNsYXNzIE5naW54SW5ncmVzcyBleHRlbmRzIGNkay5TdGFjayB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBjZGsuQ29uc3RydWN0LCBpZDogc3RyaW5nKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkKTtcblxuICAgIG5ldyBOZ2lueEluZ3Jlc3NDb25zdHJ1Y3QodGhpcywgJ25naW54JylcbiAgfVxufVxuXG50ZXN0KCdUZXN0JywgKCkgPT4ge1xuICAvLyBHSVZFTlxuICBjb25zdCBhcHAgPSBuZXcgY2RrLkFwcCgpO1xuICBjb25zdCBlbnYgPSB7XG4gICAgcmVnaW9uOiBhcHAubm9kZS50cnlHZXRDb250ZXh0KCdyZWdpb24nKSB8fCBwcm9jZXNzLmVudi5DREtfREVGQVVMVF9SRUdJT04gfHwgJ2V1LXdlc3QtMScsXG4gICAgYWNjb3VudDogYXBwLm5vZGUudHJ5R2V0Q29udGV4dCgnYWNjb3VudCcpIHx8IHByb2Nlc3MuZW52LkNES19ERUZBVUxUX0FDQ09VTlQgfHwgJ3h4eHh4eHh4eHh4eCcsXG4gIH07XG5cblxuICAvLyBXSEVOXG4gIGNvbnN0IHN0YWNrID0gbmV3IE5naW54SW5ncmVzcyhhcHAsICduZ2lueCcpO1xuICAvL2NvbnN0IHN0YWNrID0gbmV3IE15U3RhY2soYXBwLCAndGVzdCcpO1xuXG4gIC8vIFRIRU5cbiAgICAvL0ZpbmFsbHkgQ2hlY2sgU25hcHNob3RcbiAgZXhwZWN0KFN5bnRoVXRpbHMudG9DbG91ZEZvcm1hdGlvbihzdGFjaykpLnRvTWF0Y2hTbmFwc2hvdCgpO1xuXG4gIC8vIGV4cGVjdChzdGFjaykubm90LnRvSGF2ZVJlc291cmNlKCdBV1M6OlMzOjpCdWNrZXQnKTtcbiAgLy8gZXhwZWN0KGFwcC5zeW50aCgpLmdldFN0YWNrQXJ0aWZhY3Qoc3RhY2suYXJ0aWZhY3RJZCkudGVtcGxhdGUpLnRvTWF0Y2hTbmFwc2hvdCgpO1xuXG4gIGV4cGVjdChzdGFjaykudG9IYXZlUmVzb3VyY2UoJ0FXUzo6RUMyOjpWUEMnLCB7XG4gICAgRW5hYmxlRG5zU3VwcG9ydDogdHJ1ZSxcbiAgICBDaWRyQmxvY2s6ICcxMC4wLjAuMC8xNicsXG4gICAgVGFnczogW1xuICAgICAge1xuICAgICAgICBLZXk6ICdOYW1lJyxcbiAgICAgICAgVmFsdWU6ICdDYXNza29wL1ZwYycsXG4gICAgICB9LFxuICAgIF0sXG4gIH0pO1xuXG59Il19