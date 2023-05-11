import { Secret,ISecret } from 'aws-cdk-lib/aws-secretsmanager';
import { ResourceContext, ResourceProvider } from '@aws-quickstart/eks-blueprints';

export interface DatabaseInstanceCredentialsProviderProps {
    /**
     * The username for the database secret
     */
    username: string,
}

export class DatabaseInstanceCredentialsProvider implements ResourceProvider<ISecret> {
    readonly props: DatabaseInstanceCredentialsProviderProps

    constructor(props: DatabaseInstanceCredentialsProviderProps) {
        this.props = props;
    }

    provide(context: ResourceContext): ISecret {
        const id = context.scope.node.id;

        return new Secret(context.scope, "database-secret", {
            generateSecretString: {
              secretStringTemplate: JSON.stringify({
                username: this.props.username,
              }),
              excludePunctuation: true,
              includeSpace: false,
              generateStringKey: "password"
            }
        });
    }
}
