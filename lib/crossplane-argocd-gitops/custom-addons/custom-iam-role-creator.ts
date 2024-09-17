
import * as iam from 'aws-cdk-lib/aws-iam';
import { IManagedPolicy } from 'aws-cdk-lib/aws-iam';

import * as blueprints from '@aws-quickstart/eks-blueprints';

export class CreateNamedRoleProvider implements blueprints.ResourceProvider<iam.Role> {

    /**
     * Constructor to create role provider.
     * @param roleId role id
     * @param assumedBy @example  new iam.ServicePrincipal('ec2.amazonaws.com') 
     * @param policies 
     */
    constructor(private roleId: string, private roleName: string, private assumedBy: iam.IPrincipal, private policies?: IManagedPolicy[]){}

    provide(context: blueprints.ResourceContext): iam.Role {
        return new iam.Role(context.scope, this.roleId, {
            assumedBy: this.assumedBy,
            managedPolicies: this.policies,
            roleName: this.roleName
        });
    }
}
