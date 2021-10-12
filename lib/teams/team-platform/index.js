"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamPlatform = void 0;
const aws_iam_1 = require("@aws-cdk/aws-iam");
const ssp_amazon_eks_1 = require("@aws-quickstart/ssp-amazon-eks");
class TeamPlatform extends ssp_amazon_eks_1.PlatformTeam {
    constructor(accountID) {
        super({
            name: "platform",
            users: [new aws_iam_1.ArnPrincipal(`arn:aws:iam::${accountID}:user/superadmin`)]
        });
    }
}
exports.TeamPlatform = TeamPlatform;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw4Q0FBZ0Q7QUFFaEQsbUVBQThEO0FBRTlELE1BQWEsWUFBYSxTQUFRLDZCQUFZO0lBQzFDLFlBQVksU0FBaUI7UUFDekIsS0FBSyxDQUFDO1lBQ0YsSUFBSSxFQUFFLFVBQVU7WUFDaEIsS0FBSyxFQUFFLENBQUMsSUFBSSxzQkFBWSxDQUFDLGdCQUFnQixTQUFTLGtCQUFrQixDQUFDLENBQUM7U0FDekUsQ0FBQyxDQUFBO0lBQ04sQ0FBQztDQUNKO0FBUEQsb0NBT0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBcm5QcmluY2lwYWwgfSBmcm9tIFwiQGF3cy1jZGsvYXdzLWlhbVwiO1xuXG5pbXBvcnQgeyBQbGF0Zm9ybVRlYW0gfSBmcm9tICdAYXdzLXF1aWNrc3RhcnQvc3NwLWFtYXpvbi1la3MnO1xuXG5leHBvcnQgY2xhc3MgVGVhbVBsYXRmb3JtIGV4dGVuZHMgUGxhdGZvcm1UZWFtIHtcbiAgICBjb25zdHJ1Y3RvcihhY2NvdW50SUQ6IHN0cmluZykge1xuICAgICAgICBzdXBlcih7XG4gICAgICAgICAgICBuYW1lOiBcInBsYXRmb3JtXCIsXG4gICAgICAgICAgICB1c2VyczogW25ldyBBcm5QcmluY2lwYWwoYGFybjphd3M6aWFtOjoke2FjY291bnRJRH06dXNlci9zdXBlcmFkbWluYCldXG4gICAgICAgIH0pXG4gICAgfVxufSJdfQ==