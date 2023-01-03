import { NestedStack, NestedStackProps } from 'aws-cdk-lib';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as cdk from 'aws-cdk-lib';

export interface CognitoIdpStackProps extends NestedStackProps {

    /**
     * Domain name for the web site, e.g. www.example.com
     */
    readonly webDomainName: string;
    
    readonly region: string;
    readonly account: string;

}

/**
 * Stack the creates the cognito user pool, app client, configure the client and app client domain. .
 */
 
 export class CognitoIdpStack extends NestedStack {
    constructor(scope: Construct, id: string, props: CognitoIdpStackProps) {
        super(scope, id, props);

       /** if (!props.env) {
            throw Error('props.env is required');
        }
        */

        if (!props.region) {
            throw Error('props.env.region is required');
        }

        if (!props.account) {
            throw Error('props.env.account is required');
        }

        const region = props.region;
        const accountId = props.account;
        
        // Cognito User Pool
        const userPool = new cognito.UserPool(this, 'CognitoIDPUserPool', {
            selfSignUpEnabled: false,
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
            }
        });

        // Output the User Pool ID
        const userPoolOut = new cdk.CfnOutput(this, 'CognitoIDPUserPoolOut', {
            value: userPool.userPoolId,
            exportName: 'CognitoIDPUserPoolId'
        });

        // We will ask the IDP to redirect back to our domain's index page
        const redirectUri = `https://${props.webDomainName}`;
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
                    cognito.OAuthScope.PHONE,
                    cognito.OAuthScope.EMAIL,
                    cognito.OAuthScope.PROFILE,
                    cognito.OAuthScope.OPENID
                ],
                callbackUrls: [redirectUri]
                // TODO - What about logoutUrls?
            },
            generateSecret: false,
            userPoolClientName: 'Web',
            supportedIdentityProviders: [cognito.UserPoolClientIdentityProvider.COGNITO]
        });

        // Output the User Pool App Client ID
        const userPoolClientOut = new cdk.CfnOutput(this, 'CognitoIDPUserPoolClientOut', {
            value: userPoolClient.userPoolClientId,
            exportName: 'CognitoIDPUserPoolClientId'
        });
        // Our cognito domain name
        const cognitoDomainPrefix =
            `${props.webDomainName}`.toLowerCase().replace(/[.]/g, "-");

        // Add the domain to the user pool
        userPool.addDomain('CognitoDomain', {
            cognitoDomain: {
                domainPrefix: cognitoDomainPrefix,
            },
        });
    }
}
