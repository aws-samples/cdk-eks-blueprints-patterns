import * as rds from 'aws-cdk-lib/aws-rds';
import { ISecret } from 'aws-cdk-lib/aws-secretsmanager';
import { IVpc, Peer, SecurityGroup, SubnetType, Port } from 'aws-cdk-lib/aws-ec2';
import { ResourceContext, ResourceProvider } from '@aws-quickstart/eks-blueprints';

export interface DatabaseInstanceProviderProps {
    /**
     * Name of the VPC registered as a resource
     */
    vpcResourceName: string,

    /**
     * Port to be used by the database
     */
    databaseInstancePort: number,

    /**
     * The name of the Secret registered as a resource
     */
    databaseSecretResourceName: string
}

export class DatabaseInstanceProvider implements ResourceProvider<rds.IDatabaseInstance> {
    readonly props: DatabaseInstanceProviderProps;

    constructor(props: DatabaseInstanceProviderProps) {
        this.props = props;
    }

    provide(context: ResourceContext): rds.IDatabaseInstance {
        const id = context.scope.node.id;

        const databaseCredentialsSecret = context.get<ISecret>(this.props.databaseSecretResourceName);
        if (databaseCredentialsSecret === undefined) {
          throw new Error("Database Secret not found in context");
        }

        const vpc = context.get<IVpc>(this.props.vpcResourceName);
        if (vpc === undefined) {
          throw new Error("VPC not found in context");
        }

        const dbSecurityGroup = new SecurityGroup(context.scope, id+"-security-group", {
            vpc: vpc
        });
        
        dbSecurityGroup.addIngressRule(Peer.ipv4(vpc.vpcCidrBlock), Port.tcp(this.props.databaseInstancePort), "Connect from within VPC");

        const rdsConfig: rds.DatabaseInstanceProps = {
            engine: rds.DatabaseInstanceEngine.POSTGRES,
            vpc,
            vpcSubnets: {
              subnetType: SubnetType.PRIVATE_WITH_EGRESS,
            },
            securityGroups: [dbSecurityGroup],
            credentials: rds.Credentials.fromSecret(databaseCredentialsSecret),
          }
      
          return new rds.DatabaseInstance(context.scope, id+"-database-instance", rdsConfig);
    }
}
