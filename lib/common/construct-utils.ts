import { utils } from "@aws-quickstart/eks-blueprints";

export async function prevalidateSecrets(pattern: string, region?: string, ...secrets: string[]) {
    for(let secret of secrets) {
        try {
            await utils.validateSecret(secret, region ?? process.env.CDK_DEFAULT_REGION!);
        }
        catch(error) {
            throw new Error(`${secret} secret must be setup for the ${pattern} pattern to work`);
        }
    }
}