import json
import os
import boto3

def lambda_handler(event, context):
    print("Received event: " + json.dumps(event, indent=2))
    
    ssmclient = boto3.client('ssm')
    
    try:    
        paramName = '/secure-ingress-auth-cognito/ALLOWED_DOMAINS'
        resp = ssmclient.get_parameter(Name=paramName)
        allowed_domains_list = resp['Parameter']['Value']
        
        paramName = '/secure-ingress-auth-cognito/AUTO_APPROVED_DOMAINS'
        resp = ssmclient.get_parameter(Name=paramName)
        auto_approved_domains_list = resp['Parameter']['Value']
        
        paramName = '/secure-ingress-auth-cognito/EMAIL_WHITE_LIST'
        resp = ssmclient.get_parameter(Name=paramName)
        email_white_list = resp['Parameter']['Value']                

    except Exception as e:
        print("Error in reading the SSM Parameter Store : {}".format(str(e)))   
        
    triggerSource = event['triggerSource']
    
    # Split the email address so we can compare domains
    emailId = event['request']['userAttributes']['email']
    address = emailId.split('@')
    #print("address={} allowed_domains_list={} auto_approved_domains_list={} email_white_list={}".format(address,  allowed_domains_list, auto_approved_domains_list, email_white_list))
    
    emailDomain = address[1]    
    
    print("Running the Validation for {} flow".format(triggerSource))
    
    if triggerSource == 'PreSignUp_SignUp':
        # It sets the user pool autoConfirmUser flag after validating the email domain
        event['response']['autoConfirmUser'] = False

        # This example uses a custom attribute 'custom:domain'
        if emailDomain in allowed_domains_list:
            if emailDomain in auto_approved_domains_list:
                event['response']['autoConfirmUser'] = True
        else:
            raise Exception("Cannot register users with email domains other than allowed domains list={}".format(allowed_domains_list))
            
    elif triggerSource == 'PreAuthentication_Authentication':
        if emailId not in email_white_list:
            raise Exception("email id {} is not whitelisted".format(emailId))
    else:
        print("triggerSource={} is incorrect".format(triggerSource))

    #print("Received event: " + json.dumps(event, indent=2))
    
    return event