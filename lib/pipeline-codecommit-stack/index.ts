import { Construct } from 'constructs';
import { StackProps } from 'aws-cdk-lib';
// Blueprints Lib
import * as blueprints from '@aws-quickstart/eks-blueprints';
// Team implementations
import * as team from '../teams';

const burnhamManifestDir = './lib/teams/team-burnham/'
const rikerManifestDir = './lib/teams/team-riker/'
const teamManifestDirList = [burnhamManifestDir,rikerManifestDir]

/* in Cloud9 environment
    cd ~/environment/cdk-eks-blueprints-patterns
    cdk deploy codecommit-pipeline
    cd ~/environment
    aws codecommit create-repository --repository-name blueprints-eks
    git clone https://git-codecommit.us-west-1.amazonaws.com/v1/repos/blueprints-eks
    rsync -av cdk-eks-blueprints-patterns/ blueprints-eks --exclude .git --exclude node_modules --exclude cdk.out
    // edit ~/environment/blueprints-eks/bin/main.ts and comment out/remove unnesessary stacks
    cd blueprints-eks
    git add . && git commit -m "add pipeline stack" && git push
    // in case of codeBuild error "You are not authorized to perform this operation" 
    // you might need to comment out/remove cdk.context.json from .gitignore 
    // and git add . && git commit -m "add pipeline stack" && git push 
*/

export default class PipelineCodeCommitConstruct {

    async buildAsync(scope: Construct, props?: StackProps) {

        const account = process.env.CDK_DEFAULT_ACCOUNT!;
        const blueprint = blueprints.EksBlueprint.builder()
            .account(account) // the supplied default will fail, but build and synth will pass
            .region('us-west-1')
            .addOns(
                new blueprints.ArgoCDAddOn,
                new blueprints.SecretsStoreAddOn)
            .teams(
                new team.TeamRikerSetup(scope, teamManifestDirList[1]),
                new team.TeamBurnhamSetup(scope, teamManifestDirList[0])
            );

        blueprints.CodePipelineStack.builder()
            .name("blueprints-eks-codecommit-pipeline")
            .repository({
                // CodeCommit repository name, should be in the same region with pipeline-stack
                codeCommitRepoName: 'blueprints-eks',
                // targetRevision: 'master', // optional, default is "master"
            })
            .wave( {
                id: "dev",
                stages: [
                    { id: "dev-us-west-1", stackBuilder: blueprint.clone('us-west-1')},
                    // { id: "dev-us-east-2", stackBuilder: blueprint.clone('us-east-2')},
                ]
            })
            .stage({
                id: 'uat-us-east-2',
                stackBuilder: blueprint.clone('us-east-2'),
                stageProps: {
                    pre: [new blueprints.pipelines.cdkpipelines.ManualApprovalStep('manual-approval')]
                }
            })
            // .wave( {
            //     id: "prod",
            //     stages: [
            //         { id: "prod-us-west-1", stackBuilder: blueprint.clone('us-west-1')},
            //         { id: "prod-us-east-2", stackBuilder: blueprint.clone('us-east-2')},
            //     ]
            // })
            .build(scope, "codecommit-pipeline", props);
    }
 }