import 'source-map-support/register';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import { LookupHostedZoneProvider, GlobalResources, utils } from '@aws-quickstart/eks-blueprints';
import { KubecostAddOn } from '@kubecost/kubecost-eks-blueprints-addon';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { prevalidateSecrets } from '../common/construct-utils';
import { SECRET_ARGO_ADMIN_PWD } from '../multi-region-construct';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';

const gitUrl = 'https://github.com/aws-samples/eks-blueprints-workloads.git';

//Class Cognito Stack 

/**
 * Stack creates the cognito user pool, app client, configure the client and app client domain. 
 * Amazon Cognito hosted UI provides you an OAuth2.0 compliant authorization server that provides default implementation of end user flows such as registration, authentication, and so on.
 */

class CognitoIdpStack extends cdk.Stack {

    public readonly userPoolOut: cognito.UserPool;
    public readonly userPoolClientOut: cognito.UserPoolClient;
    public readonly userPoolDomainOut: cognito.UserPoolDomain;
    
    constructor(scope: Construct, id: string, subDomain: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const lambdaExecutionRole = new iam.Role(this, 'Lambda Execution Role', {
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        });

        lambdaExecutionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"));
        lambdaExecutionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMReadOnlyAccess"));     
        
        const authChallengeFn = new lambda.Function(this, 'authChallengeFn', {
            runtime: lambda.Runtime.PYTHON_3_7,
            code: lambda.Code.fromAsset('./lib/secure-ingress-auth-cognito/lambda'),
            handler: 'lambda_function.lambda_handler',
            role: lambdaExecutionRole,
        });


        // Cognito User Pool
        const userPool = new cognito.UserPool(this, 'CognitoIDPUserPool', {
            userPoolName: 'CognitoIDPUserPool',
            selfSignUpEnabled: true,
            signInAliases: {
                email: true,
                username: true
            },
            standardAttributes: {
                email: {
                    mutable: true,
                    required: true
                },
                givenName: {
                    mutable: true,
                    required: true
                },
                familyName: {
                    mutable: true,
                    required: true
                }
            },
            lambdaTriggers: {
                preSignUp: authChallengeFn,
                preAuthentication: authChallengeFn,
            },            
        });
        
        
        // Output the User Pool ID

        this.userPoolOut = userPool;
        
        new cdk.CfnOutput(this, 'CognitoIDPUserPoolOut', {
            value: userPool.userPoolId,
            exportName: 'CognitoIDPUserPoolId'
        });
        
        new cdk.CfnOutput(this, 'CognitoIDPUserPoolArnOut', {
            value: userPool.userPoolArn,
            exportName: 'CognitoIDPUserPoolArn'
        });


        // We will ask the IDP to redirect back to our domain's index page
        const redirectUri = `https://${subDomain}/oauth2/idpresponse`;
      
        // Configure the user pool client application 
        const userPoolClient = new cognito.UserPoolClient(this, 'CognitoAppClient', {
            userPool,
            authFlows: {
                userPassword: true
            },
            oAuth: {
                flows: {
                    authorizationCodeGrant: true
                },
                scopes: [
                    cognito.OAuthScope.OPENID
                ],
                callbackUrls: [redirectUri]
                // TODO - What about logoutUrls?
            },
            generateSecret: true,
            userPoolClientName: 'Web',
            supportedIdentityProviders: [cognito.UserPoolClientIdentityProvider.COGNITO]
        });

        // Output the User Pool App Client ID
        this.userPoolClientOut = userPoolClient;

        new cdk.CfnOutput(this, 'CognitoIDPUserPoolClientOut', {
            value: userPoolClient.userPoolClientId,
            exportName: 'CognitoIDPUserPoolClientId'
        });

        // Add the domain to the user pool
        const userPoolDomain = userPool.addDomain('CognitoDomain', {
            cognitoDomain: {
                domainPrefix: 'my-cdk-blueprint',
            },
        });

        // Output the User Pool App Client ID

        this.userPoolDomainOut = userPoolDomain;
    
        new cdk.CfnOutput(this, 'CognitoIDPUserPoolDomainOut', {
            value: userPoolDomain.domainName,
            exportName: 'CognitoIDPUserPoolDomain'
        });
        
    }
}


/**
 * See docs/patterns/secure-ingress-cognito.md for mode details on the setup.
 */
export class SecureIngressCognito extends cdk.Stack{

    async buildAsync(scope: Construct, id: string) {

        await prevalidateSecrets(SecureIngressCognito.name, undefined, SECRET_ARGO_ADMIN_PWD);

        const subdomain: string = utils.valueFromContext(scope, "dev.subzone.name", "dev.mycompany.a2z.com");
        const parentDomain = utils.valueFromContext(scope, "parent.hostedzone.name", "mycompany.a2z.com");

        const cognitoIdpStackOut = new CognitoIdpStack (scope,'cognito-idp-stack', subdomain,
            {
                env: {
                    account: process.env.CDK_DEFAULT_ACCOUNT,
                    region: process.env.CDK_DEFAULT_REGION,
                },
            }
        );

        blueprints.HelmAddOn.validateHelmVersions = false;

        await blueprints.EksBlueprint.builder()
            .account(process.env.CDK_DEFAULT_ACCOUNT)
            .region(process.env.CDK_DEFAULT_REGION)
            .resourceProvider(GlobalResources.HostedZone, new LookupHostedZoneProvider(parentDomain))
            .resourceProvider(GlobalResources.Certificate, new blueprints.CreateCertificateProvider('secure-ingress-cert', `${subdomain}`, GlobalResources.HostedZone))
            .addOns(
                new blueprints.AwsLoadBalancerControllerAddOn,
                new blueprints.VpcCniAddOn(),
                new blueprints.CoreDnsAddOn(),
                new KubecostAddOn(),
                new blueprints.addons.EbsCsiDriverAddOn(),
                new blueprints.ExternalDnsAddOn({
                    hostedZoneResources: [GlobalResources.HostedZone] // you can add more if you register resource providers
                }),
                new blueprints.SecretsStoreAddOn({ rotationPollInterval: "120s" }),
                new blueprints.ArgoCDAddOn({
                    bootstrapRepo: {
                        repoUrl: gitUrl,
                        targetRevision: "main",
                        path: 'secure-ingress-cognito/envs/dev'
                    },
                    bootstrapValues: {
                        spec: {
                            ingress: {
                                host: subdomain,
                                cognitoUserPoolArn: cognitoIdpStackOut.userPoolOut.userPoolArn,
                                cognitoUserPoolAppId: cognitoIdpStackOut.userPoolClientOut.userPoolClientId,
                                cognitoDomainName: cognitoIdpStackOut.userPoolDomainOut.domainName,
                                region: process.env.CDK_DEFAULT_REGION,
                            }
                        },
                    },
                    adminPasswordSecretName: SECRET_ARGO_ADMIN_PWD,
                }),
            )
            .buildAsync(scope, `${id}-blueprint`);

        blueprints.HelmAddOn.validateHelmVersions = false; 
    }
}


