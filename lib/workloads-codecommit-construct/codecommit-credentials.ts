import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId, PhysicalResourceIdReference } from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';

export class CodeCommitCredentials extends Construct {
    readonly serviceSpecificCredentialId: string;
    readonly serviceName: string;
    readonly serviceUserName: string;
    readonly servicePassword: string;
    readonly status: string;

    constructor(scope: Construct, id: string, userName: string) {
        super(scope, id);

        const codeCommitCredentialsResponse = new AwsCustomResource(this, "codecommit-credentials-custom-resource", {
            onCreate: {
                service: "IAM",
                action: "createServiceSpecificCredential",
                parameters: {
                    ServiceName: "codecommit.amazonaws.com",
                    UserName: userName
                },
                physicalResourceId: PhysicalResourceId.fromResponse("ServiceSpecificCredential.ServiceSpecificCredentialId")
            },
            onDelete: {
                service: "IAM",
                action: "deleteServiceSpecificCredential",
                parameters: {
                    ServiceSpecificCredentialId: new PhysicalResourceIdReference(),
                    UserName: userName,
                }
            },
            policy: AwsCustomResourcePolicy.fromSdkCalls({
                resources: AwsCustomResourcePolicy.ANY_RESOURCE,
            }),
        });

        this.serviceSpecificCredentialId = codeCommitCredentialsResponse.getResponseField("ServiceSpecificCredential.ServiceSpecificCredentialId");
        this.serviceName = codeCommitCredentialsResponse.getResponseField("ServiceSpecificCredential.ServiceName");
        this.serviceUserName = codeCommitCredentialsResponse.getResponseField("ServiceSpecificCredential.ServiceUserName");
        this.servicePassword = codeCommitCredentialsResponse.getResponseField("ServiceSpecificCredential.ServicePassword");
        this.status = codeCommitCredentialsResponse.getResponseField("ServiceSpecificCredential.Status");
    }
}