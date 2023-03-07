import { Construct } from 'constructs';
import * as blueprints from '@aws-quickstart/eks-blueprints'
import { BatchEksTeam } from '@aws-quickstart/eks-blueprints';

export default class BatchOnEKSConstruct {
    build(scope: Construct, id: string, teams: BatchEksTeam[]) {
        
        const stackID = `${id}-blueprint`
        blueprints.EksBlueprint.builder()
            .account(process.env.CDK_DEFAULT_ACCOUNT!)
            .region(process.env.CDK_DEFAULT_REGION!)
            .addOns(new blueprints.AwsBatchAddOn())
            .teams(...teams)
            .build(scope, stackID);
    }
}