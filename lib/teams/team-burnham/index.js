"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamBurnhamSetup = void 0;
const aws_iam_1 = require("@aws-cdk/aws-iam");
const ssp_amazon_eks_1 = require("@aws-quickstart/ssp-amazon-eks");
function getUserArns(scope, key) {
    const context = scope.node.tryGetContext(key);
    if (context) {
        return context.split(",").map(e => new aws_iam_1.ArnPrincipal(e));
    }
    return [];
}
class TeamBurnhamSetup extends ssp_amazon_eks_1.ApplicationTeam {
    constructor(scope) {
        super({
            name: "burnham",
            users: getUserArns(scope, "team-burnham.users"),
            namespaceAnnotations: {
                "appmesh.k8s.aws/sidecarInjectorWebhook": "enabled"
            }
        });
    }
}
exports.TeamBurnhamSetup = TeamBurnhamSetup;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw4Q0FBZ0Q7QUFHaEQsbUVBQWlFO0FBRWpFLFNBQVMsV0FBVyxDQUFDLEtBQWdCLEVBQUUsR0FBVztJQUM5QyxNQUFNLE9BQU8sR0FBVyxLQUFLLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUN0RCxJQUFJLE9BQU8sRUFBRTtRQUNULE9BQU8sT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLHNCQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUMzRDtJQUNELE9BQU8sRUFBRSxDQUFDO0FBQ2QsQ0FBQztBQUVELE1BQWEsZ0JBQWlCLFNBQVEsZ0NBQWU7SUFDakQsWUFBWSxLQUFnQjtRQUN4QixLQUFLLENBQUM7WUFDRixJQUFJLEVBQUUsU0FBUztZQUNmLEtBQUssRUFBRSxXQUFXLENBQUMsS0FBSyxFQUFFLG9CQUFvQixDQUFDO1lBQy9DLG9CQUFvQixFQUFFO2dCQUNsQix3Q0FBd0MsRUFBRSxTQUFTO2FBQ3REO1NBQ0osQ0FBQyxDQUFDO0lBQ1AsQ0FBQztDQUNKO0FBVkQsNENBVUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBcm5QcmluY2lwYWwgfSBmcm9tICdAYXdzLWNkay9hd3MtaWFtJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ0Bhd3MtY2RrL2NvcmUnO1xuXG5pbXBvcnQgeyBBcHBsaWNhdGlvblRlYW0gfSBmcm9tICdAYXdzLXF1aWNrc3RhcnQvc3NwLWFtYXpvbi1la3MnO1xuXG5mdW5jdGlvbiBnZXRVc2VyQXJucyhzY29wZTogQ29uc3RydWN0LCBrZXk6IHN0cmluZyk6IEFyblByaW5jaXBhbFtdIHtcbiAgICBjb25zdCBjb250ZXh0OiBzdHJpbmcgPSBzY29wZS5ub2RlLnRyeUdldENvbnRleHQoa2V5KTtcbiAgICBpZiAoY29udGV4dCkge1xuICAgICAgICByZXR1cm4gY29udGV4dC5zcGxpdChcIixcIikubWFwKGUgPT4gbmV3IEFyblByaW5jaXBhbChlKSk7XG4gICAgfVxuICAgIHJldHVybiBbXTtcbn1cblxuZXhwb3J0IGNsYXNzIFRlYW1CdXJuaGFtU2V0dXAgZXh0ZW5kcyBBcHBsaWNhdGlvblRlYW0ge1xuICAgIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QpIHtcbiAgICAgICAgc3VwZXIoe1xuICAgICAgICAgICAgbmFtZTogXCJidXJuaGFtXCIsXG4gICAgICAgICAgICB1c2VyczogZ2V0VXNlckFybnMoc2NvcGUsIFwidGVhbS1idXJuaGFtLnVzZXJzXCIpLFxuICAgICAgICAgICAgbmFtZXNwYWNlQW5ub3RhdGlvbnM6IHtcbiAgICAgICAgICAgICAgICBcImFwcG1lc2guazhzLmF3cy9zaWRlY2FySW5qZWN0b3JXZWJob29rXCI6IFwiZW5hYmxlZFwiXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbn0iXX0=