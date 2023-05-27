import { Construct } from "constructs";
import { EKSClient, DescribeClusterCommand } from "@aws-sdk/client-eks";



export class ImportClusterConstruct {

    async build(scope: Construct, clusterName: string) {
        const client = new EKSClient({ region: process.env.CDK_DEFAULT_REGION });

    }


    
}