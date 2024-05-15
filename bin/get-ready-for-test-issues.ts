import * as AWS from "@aws-sdk/client-secrets-manager";
import { Octokit } from '@octokit/rest'

export const READY_FOR_TEST= "Ready for test";

/**
 * Invoke with
 * @param region process.env.CDK_DEFAULT_REGION
 * @param secretName process.env.GITHUB_SECRET
 * @param repo "jalawala"
 * @param owner "aws-eks-addon-publication"
 */
export async function getReadyForTestAddons(region: string, secretName: string, repo: string, owner: string){
    const issues = await getReadyForTestIssues(region, secretName, repo, owner) as Issue[];
    // TODO do something with this addon
    issues.forEach(issue => console.log(issue.number + ", " + issue.body));
}

async function getReadyForTestIssues(region: string, secretName: string, repo: string, owner: string){
    const sm = new AWS.SecretsManager({region});

    const accessToken = await getGitHubAccessToken(sm, secretName);
    const octokit = new Octokit({ auth: accessToken });

    const getIssuesRequest = {
        headers: {
            'X-GitHub-Api-Version': '2022-11-28'
        },
        owner,
        repo,
        labels: READY_FOR_TEST
    };

   const responsePromise =  octokit.request("GET /repos/{owner}/{repo}/issues", getIssuesRequest);

    return responsePromise
        .then((response)=>  response.data as Issue[])
        .catch((error)=>{console.error(`Create issue error: ${error}`)})
}

type Issue = {
   number: number;
    body: string;
}

async function getGitHubAccessToken(sm : AWS.SecretsManager, secretName : string) {
    const secret = await sm.getSecretValue({ SecretId: secretName });
    const secretString = secret.SecretString;
    if (typeof secretString === 'string') {
        return secretString;
    } else {
        throw new Error('SecretString is not a string.');
    }
}
