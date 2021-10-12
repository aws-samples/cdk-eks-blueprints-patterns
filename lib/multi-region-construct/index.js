"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// SSP Lib
const ssp = require("@aws-quickstart/ssp-amazon-eks");
const secrets_manager_utils_1 = require("@aws-quickstart/ssp-amazon-eks/dist/utils/secrets-manager-utils");
// Team implementations
const team = require("../teams");
/**
 * This pattern demonstrates how to roll out a platform across multiple regions and multiple stages.
 * Each region represents a stage in the development process, i.e. dev, test, prod.
 * To use this pattern as is you need to create the following secrets in us-east-1 and replicate them to us-east-2 and us-west-2:
 * - github-ssh-test - containing SSH key for github authentication (plaintext in AWS Secrets manager)
 * - argo-admin-secret - containing the initial admin secret for ArgoCD (e.g. CLI and UI access)
 */
class MultiRegionConstruct {
    async buildAsync(scope, id) {
        // Setup platform team
        const accountID = process.env.CDK_DEFAULT_ACCOUNT;
        const gitUrl = 'https://github.com/aws-samples/ssp-eks-workloads.git';
        //const gitSecureUrl = 'git@github.com:aws-samples/ssp-eks-workloads.git';
        try {
            await secrets_manager_utils_1.getSecretValue(MultiRegionConstruct.SECRET_GIT_TOKEN, 'eu-west-1');
            await secrets_manager_utils_1.getSecretValue(MultiRegionConstruct.SECRET_ARGO_ADMIN_PWD, 'eu-west-1');
        }
        catch (error) {
            throw new Error("Both github-ssh-key and argo-admin-secret secrets must be setup for the multi-region pattern to work.");
        }
        const blueprint = ssp.EksBlueprint.builder()
            .account(process.env.CDK_DEFAULT_ACCOUNT)
            .addOns(new ssp.AwsLoadBalancerControllerAddOn, new ssp.NginxAddOn, new ssp.CalicoAddOn, new ssp.MetricsServerAddOn, new ssp.ClusterAutoScalerAddOn, new ssp.ContainerInsightsAddOn)
            .teams(new team.TeamPlatform(accountID), new team.TeamTroiSetup, new team.TeamRikerSetup, new team.TeamBurnhamSetup(scope));
        const devBootstrapArgo = new ssp.ArgoCDAddOn({
            bootstrapRepo: {
                repoUrl: gitUrl,
                path: 'envs/dev',
                credentialsSecretName: MultiRegionConstruct.SECRET_GIT_TOKEN,
                credentialsType: 'TOKEN'
            }
        });
        // const testBootstrapArgo = new ssp.ArgoCDAddOn({
        //     bootstrapRepo: {
        //         //repoUrl: gitSecureUrl,
        //         repoUrl: gitUrl,
        //         path: 'envs/test',
        //          credentialsSecretName: MultiRegionConstruct.SECRET_GIT_TOKEN,
        //         // credentialsType: 'SSH'
        //         credentialsType: 'TOKEN'
        //     },
        // });
        // const prodBootstrapArgo = new ssp.ArgoCDAddOn({
        //     bootstrapRepo: {
        //         repoUrl: gitUrl,
        //         path: 'envs/prod',
        //         credentialsSecretName: MultiRegionConstruct.SECRET_GIT_TOKEN,
        //         credentialsType: 'TOKEN'
        //     },
        //     adminPasswordSecretName: MultiRegionConstruct.SECRET_ARGO_ADMIN_PWD,
        // });
        const dev = await blueprint.clone('eu-west-3')
            .addOns(devBootstrapArgo)
            .buildAsync(scope, `${id}-dev`);
        // const test = await blueprint.clone('us-east-2')
        //     .addOns(testBootstrapArgo)
        //     .buildAsync(scope, `${id}-test`);
        // const prod = await blueprint.clone('eu-west-1')
        //     .addOns(prodBootstrapArgo)
        //     .buildAsync(scope, `${id}-prod`);
        return [dev];
        // return [ dev, test, prod ];
    }
}
exports.default = MultiRegionConstruct;
MultiRegionConstruct.SECRET_GIT_SSH_KEY = 'github-ssh-key';
MultiRegionConstruct.SECRET_GIT_TOKEN = 'github-token-kv';
MultiRegionConstruct.SECRET_ARGO_ADMIN_PWD = 'argo-admin-secret';
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUVBLFVBQVU7QUFDVixzREFBc0Q7QUFFdEQsMkdBQWlHO0FBRWpHLHVCQUF1QjtBQUN2QixpQ0FBZ0M7QUFHaEM7Ozs7OztHQU1HO0FBQ0gsTUFBcUIsb0JBQW9CO0lBTXJDLEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBb0IsRUFBRSxFQUFVO1FBQzdDLHNCQUFzQjtRQUN0QixNQUFNLFNBQVMsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFvQixDQUFDO1FBQ25ELE1BQU0sTUFBTSxHQUFHLHNEQUFzRCxDQUFDO1FBQ3RFLDBFQUEwRTtRQUUxRSxJQUFJO1lBQ0EsTUFBTSxzQ0FBYyxDQUFDLG9CQUFvQixDQUFDLGdCQUFnQixFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQ3pFLE1BQU0sc0NBQWMsQ0FBQyxvQkFBb0IsQ0FBQyxxQkFBcUIsRUFBRSxXQUFXLENBQUMsQ0FBQztTQUNqRjtRQUNELE9BQU0sS0FBSyxFQUFFO1lBQ1QsTUFBTSxJQUFJLEtBQUssQ0FBQyx1R0FBdUcsQ0FBQyxDQUFDO1NBQzVIO1FBRUQsTUFBTSxTQUFTLEdBQUcsR0FBRyxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUU7YUFDdkMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW9CLENBQUM7YUFDekMsTUFBTSxDQUFDLElBQUksR0FBRyxDQUFDLDhCQUE4QixFQUMxQyxJQUFJLEdBQUcsQ0FBQyxVQUFVLEVBQ2xCLElBQUksR0FBRyxDQUFDLFdBQVcsRUFDbkIsSUFBSSxHQUFHLENBQUMsa0JBQWtCLEVBQzFCLElBQUksR0FBRyxDQUFDLHNCQUFzQixFQUM5QixJQUFJLEdBQUcsQ0FBQyxzQkFBc0IsQ0FBQzthQUNsQyxLQUFLLENBQUUsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxFQUNwQyxJQUFJLElBQUksQ0FBQyxhQUFhLEVBQ3RCLElBQUksSUFBSSxDQUFDLGNBQWMsRUFDdkIsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUcxQyxNQUFNLGdCQUFnQixHQUFHLElBQUksR0FBRyxDQUFDLFdBQVcsQ0FBQztZQUN6QyxhQUFhLEVBQUU7Z0JBQ1gsT0FBTyxFQUFFLE1BQU07Z0JBQ2YsSUFBSSxFQUFFLFVBQVU7Z0JBQ2hCLHFCQUFxQixFQUFFLG9CQUFvQixDQUFDLGdCQUFnQjtnQkFDNUQsZUFBZSxFQUFFLE9BQU87YUFDM0I7U0FDSixDQUFDLENBQUM7UUFFSCxrREFBa0Q7UUFDbEQsdUJBQXVCO1FBQ3ZCLG1DQUFtQztRQUNuQywyQkFBMkI7UUFDM0IsNkJBQTZCO1FBQzdCLHlFQUF5RTtRQUN6RSxvQ0FBb0M7UUFDcEMsbUNBQW1DO1FBQ25DLFNBQVM7UUFDVCxNQUFNO1FBRU4sa0RBQWtEO1FBQ2xELHVCQUF1QjtRQUN2QiwyQkFBMkI7UUFDM0IsNkJBQTZCO1FBQzdCLHdFQUF3RTtRQUN4RSxtQ0FBbUM7UUFDbkMsU0FBUztRQUNULDJFQUEyRTtRQUMzRSxNQUFNO1FBRU4sTUFBTSxHQUFHLEdBQUcsTUFBTSxTQUFTLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQzthQUN6QyxNQUFNLENBQUMsZ0JBQWdCLENBQUM7YUFDeEIsVUFBVSxDQUFDLEtBQUssRUFBRyxHQUFHLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFFckMsa0RBQWtEO1FBQ2xELGlDQUFpQztRQUNqQyx3Q0FBd0M7UUFFeEMsa0RBQWtEO1FBQ2xELGlDQUFpQztRQUNqQyx3Q0FBd0M7UUFFeEMsT0FBTyxDQUFFLEdBQUcsQ0FBRSxDQUFDO1FBQ2YsOEJBQThCO0lBQ2xDLENBQUM7O0FBOUVMLHVDQStFQztBQTdFbUIsdUNBQWtCLEdBQUcsZ0JBQWdCLENBQUM7QUFDckMscUNBQWdCLEdBQUcsaUJBQWlCLENBQUM7QUFDdEMsMENBQXFCLEdBQUcsbUJBQW1CLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnQGF3cy1jZGsvY29yZSc7XG5cbi8vIFNTUCBMaWJcbmltcG9ydCAqIGFzIHNzcCBmcm9tICdAYXdzLXF1aWNrc3RhcnQvc3NwLWFtYXpvbi1la3MnO1xuXG5pbXBvcnQgeyBnZXRTZWNyZXRWYWx1ZSB9IGZyb20gJ0Bhd3MtcXVpY2tzdGFydC9zc3AtYW1hem9uLWVrcy9kaXN0L3V0aWxzL3NlY3JldHMtbWFuYWdlci11dGlscyc7XG5cbi8vIFRlYW0gaW1wbGVtZW50YXRpb25zXG5pbXBvcnQgKiBhcyB0ZWFtIGZyb20gJy4uL3RlYW1zJ1xuXG5cbi8qKlxuICogVGhpcyBwYXR0ZXJuIGRlbW9uc3RyYXRlcyBob3cgdG8gcm9sbCBvdXQgYSBwbGF0Zm9ybSBhY3Jvc3MgbXVsdGlwbGUgcmVnaW9ucyBhbmQgbXVsdGlwbGUgc3RhZ2VzLlxuICogRWFjaCByZWdpb24gcmVwcmVzZW50cyBhIHN0YWdlIGluIHRoZSBkZXZlbG9wbWVudCBwcm9jZXNzLCBpLmUuIGRldiwgdGVzdCwgcHJvZC4gXG4gKiBUbyB1c2UgdGhpcyBwYXR0ZXJuIGFzIGlzIHlvdSBuZWVkIHRvIGNyZWF0ZSB0aGUgZm9sbG93aW5nIHNlY3JldHMgaW4gdXMtZWFzdC0xIGFuZCByZXBsaWNhdGUgdGhlbSB0byB1cy1lYXN0LTIgYW5kIHVzLXdlc3QtMjpcbiAqIC0gZ2l0aHViLXNzaC10ZXN0IC0gY29udGFpbmluZyBTU0gga2V5IGZvciBnaXRodWIgYXV0aGVudGljYXRpb24gKHBsYWludGV4dCBpbiBBV1MgU2VjcmV0cyBtYW5hZ2VyKVxuICogLSBhcmdvLWFkbWluLXNlY3JldCAtIGNvbnRhaW5pbmcgdGhlIGluaXRpYWwgYWRtaW4gc2VjcmV0IGZvciBBcmdvQ0QgKGUuZy4gQ0xJIGFuZCBVSSBhY2Nlc3MpXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE11bHRpUmVnaW9uQ29uc3RydWN0IHtcblxuICAgIHN0YXRpYyByZWFkb25seSBTRUNSRVRfR0lUX1NTSF9LRVkgPSAnZ2l0aHViLXNzaC1rZXknO1xuICAgICBzdGF0aWMgcmVhZG9ubHkgU0VDUkVUX0dJVF9UT0tFTiA9ICdnaXRodWItdG9rZW4ta3YnO1xuICAgIHN0YXRpYyByZWFkb25seSBTRUNSRVRfQVJHT19BRE1JTl9QV0QgPSAnYXJnby1hZG1pbi1zZWNyZXQnO1xuXG4gICAgYXN5bmMgYnVpbGRBc3luYyhzY29wZTogY2RrLkNvbnN0cnVjdCwgaWQ6IHN0cmluZykgOiBQcm9taXNlPHNzcC5Fa3NCbHVlcHJpbnRbXT4ge1xuICAgICAgICAvLyBTZXR1cCBwbGF0Zm9ybSB0ZWFtXG4gICAgICAgIGNvbnN0IGFjY291bnRJRCA9IHByb2Nlc3MuZW52LkNES19ERUZBVUxUX0FDQ09VTlQhO1xuICAgICAgICBjb25zdCBnaXRVcmwgPSAnaHR0cHM6Ly9naXRodWIuY29tL2F3cy1zYW1wbGVzL3NzcC1la3Mtd29ya2xvYWRzLmdpdCc7XG4gICAgICAgIC8vY29uc3QgZ2l0U2VjdXJlVXJsID0gJ2dpdEBnaXRodWIuY29tOmF3cy1zYW1wbGVzL3NzcC1la3Mtd29ya2xvYWRzLmdpdCc7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IGdldFNlY3JldFZhbHVlKE11bHRpUmVnaW9uQ29uc3RydWN0LlNFQ1JFVF9HSVRfVE9LRU4sICdldS13ZXN0LTEnKTtcbiAgICAgICAgICAgIGF3YWl0IGdldFNlY3JldFZhbHVlKE11bHRpUmVnaW9uQ29uc3RydWN0LlNFQ1JFVF9BUkdPX0FETUlOX1BXRCwgJ2V1LXdlc3QtMScpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoKGVycm9yKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJCb3RoIGdpdGh1Yi1zc2gta2V5IGFuZCBhcmdvLWFkbWluLXNlY3JldCBzZWNyZXRzIG11c3QgYmUgc2V0dXAgZm9yIHRoZSBtdWx0aS1yZWdpb24gcGF0dGVybiB0byB3b3JrLlwiKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgY29uc3QgYmx1ZXByaW50ID0gc3NwLkVrc0JsdWVwcmludC5idWlsZGVyKClcbiAgICAgICAgICAgIC5hY2NvdW50KHByb2Nlc3MuZW52LkNES19ERUZBVUxUX0FDQ09VTlQhKVxuICAgICAgICAgICAgLmFkZE9ucyhuZXcgc3NwLkF3c0xvYWRCYWxhbmNlckNvbnRyb2xsZXJBZGRPbixcbiAgICAgICAgICAgICAgICBuZXcgc3NwLk5naW54QWRkT24sXG4gICAgICAgICAgICAgICAgbmV3IHNzcC5DYWxpY29BZGRPbixcbiAgICAgICAgICAgICAgICBuZXcgc3NwLk1ldHJpY3NTZXJ2ZXJBZGRPbixcbiAgICAgICAgICAgICAgICBuZXcgc3NwLkNsdXN0ZXJBdXRvU2NhbGVyQWRkT24sXG4gICAgICAgICAgICAgICAgbmV3IHNzcC5Db250YWluZXJJbnNpZ2h0c0FkZE9uKVxuICAgICAgICAgICAgLnRlYW1zKCBuZXcgdGVhbS5UZWFtUGxhdGZvcm0oYWNjb3VudElEKSxcbiAgICAgICAgICAgICAgICBuZXcgdGVhbS5UZWFtVHJvaVNldHVwLFxuICAgICAgICAgICAgICAgIG5ldyB0ZWFtLlRlYW1SaWtlclNldHVwLFxuICAgICAgICAgICAgICAgIG5ldyB0ZWFtLlRlYW1CdXJuaGFtU2V0dXAoc2NvcGUpKTtcblxuXG4gICAgICAgIGNvbnN0IGRldkJvb3RzdHJhcEFyZ28gPSBuZXcgc3NwLkFyZ29DREFkZE9uKHtcbiAgICAgICAgICAgIGJvb3RzdHJhcFJlcG86IHtcbiAgICAgICAgICAgICAgICByZXBvVXJsOiBnaXRVcmwsXG4gICAgICAgICAgICAgICAgcGF0aDogJ2VudnMvZGV2JyxcbiAgICAgICAgICAgICAgICBjcmVkZW50aWFsc1NlY3JldE5hbWU6IE11bHRpUmVnaW9uQ29uc3RydWN0LlNFQ1JFVF9HSVRfVE9LRU4sXG4gICAgICAgICAgICAgICAgY3JlZGVudGlhbHNUeXBlOiAnVE9LRU4nXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIGNvbnN0IHRlc3RCb290c3RyYXBBcmdvID0gbmV3IHNzcC5BcmdvQ0RBZGRPbih7XG4gICAgICAgIC8vICAgICBib290c3RyYXBSZXBvOiB7XG4gICAgICAgIC8vICAgICAgICAgLy9yZXBvVXJsOiBnaXRTZWN1cmVVcmwsXG4gICAgICAgIC8vICAgICAgICAgcmVwb1VybDogZ2l0VXJsLFxuICAgICAgICAvLyAgICAgICAgIHBhdGg6ICdlbnZzL3Rlc3QnLFxuICAgICAgICAvLyAgICAgICAgICBjcmVkZW50aWFsc1NlY3JldE5hbWU6IE11bHRpUmVnaW9uQ29uc3RydWN0LlNFQ1JFVF9HSVRfVE9LRU4sXG4gICAgICAgIC8vICAgICAgICAgLy8gY3JlZGVudGlhbHNUeXBlOiAnU1NIJ1xuICAgICAgICAvLyAgICAgICAgIGNyZWRlbnRpYWxzVHlwZTogJ1RPS0VOJ1xuICAgICAgICAvLyAgICAgfSxcbiAgICAgICAgLy8gfSk7XG5cbiAgICAgICAgLy8gY29uc3QgcHJvZEJvb3RzdHJhcEFyZ28gPSBuZXcgc3NwLkFyZ29DREFkZE9uKHtcbiAgICAgICAgLy8gICAgIGJvb3RzdHJhcFJlcG86IHtcbiAgICAgICAgLy8gICAgICAgICByZXBvVXJsOiBnaXRVcmwsXG4gICAgICAgIC8vICAgICAgICAgcGF0aDogJ2VudnMvcHJvZCcsXG4gICAgICAgIC8vICAgICAgICAgY3JlZGVudGlhbHNTZWNyZXROYW1lOiBNdWx0aVJlZ2lvbkNvbnN0cnVjdC5TRUNSRVRfR0lUX1RPS0VOLFxuICAgICAgICAvLyAgICAgICAgIGNyZWRlbnRpYWxzVHlwZTogJ1RPS0VOJ1xuICAgICAgICAvLyAgICAgfSxcbiAgICAgICAgLy8gICAgIGFkbWluUGFzc3dvcmRTZWNyZXROYW1lOiBNdWx0aVJlZ2lvbkNvbnN0cnVjdC5TRUNSRVRfQVJHT19BRE1JTl9QV0QsXG4gICAgICAgIC8vIH0pO1xuICAgICAgICBcbiAgICAgICAgY29uc3QgZGV2ID0gYXdhaXQgYmx1ZXByaW50LmNsb25lKCdldS13ZXN0LTMnKVxuICAgICAgICAgICAgLmFkZE9ucyhkZXZCb290c3RyYXBBcmdvKVxuICAgICAgICAgICAgLmJ1aWxkQXN5bmMoc2NvcGUsICBgJHtpZH0tZGV2YCk7XG4gICAgICAgIFxuICAgICAgICAvLyBjb25zdCB0ZXN0ID0gYXdhaXQgYmx1ZXByaW50LmNsb25lKCd1cy1lYXN0LTInKVxuICAgICAgICAvLyAgICAgLmFkZE9ucyh0ZXN0Qm9vdHN0cmFwQXJnbylcbiAgICAgICAgLy8gICAgIC5idWlsZEFzeW5jKHNjb3BlLCBgJHtpZH0tdGVzdGApO1xuICAgICAgICBcbiAgICAgICAgLy8gY29uc3QgcHJvZCA9IGF3YWl0IGJsdWVwcmludC5jbG9uZSgnZXUtd2VzdC0xJylcbiAgICAgICAgLy8gICAgIC5hZGRPbnMocHJvZEJvb3RzdHJhcEFyZ28pXG4gICAgICAgIC8vICAgICAuYnVpbGRBc3luYyhzY29wZSwgYCR7aWR9LXByb2RgKTtcblxuICAgICAgICByZXR1cm4gWyBkZXYgXTtcbiAgICAgICAgLy8gcmV0dXJuIFsgZGV2LCB0ZXN0LCBwcm9kIF07XG4gICAgfVxufVxuXG5cbiJdfQ==