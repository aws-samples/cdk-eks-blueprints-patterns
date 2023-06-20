import { loadYaml } from "@aws-quickstart/eks-blueprints/dist/utils";
import * as cdk from "aws-cdk-lib";
import { InstanaOperatorAddon } from "@instana/aws-eks-blueprint-addon";
import { EksBlueprint } from "@aws-quickstart/eks-blueprints";

export const instanaProps = {
    //instana-secret-param is the name of AWS Secret Manager Secrets
    secretParamName: 'instana-secret-param'
};

const yamlObject = loadYaml(JSON.stringify(instanaProps));

export default class InstanaConstruct {
    async buildAsync(scope: cdk.App, id: string) {
        try {
            const stackId = `${id}-blueprint`;
            const addOns = new InstanaOperatorAddon(yamlObject);

            EksBlueprint.builder()
                .account(process.env.CDK_DEFAULT_ACCOUNT!)
                .region(process.env.CDK_DEFAULT_REGION!)
                .addOns(addOns)
                .build(scope, stackId);
            console.log("Blueprint built successfully.");
        } catch (error) {
            console.error("Error:", error);
            throw new Error(`environment variables must be setup for the instana-operator pattern to work`);
        }
    }
}
