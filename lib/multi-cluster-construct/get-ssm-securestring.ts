import { SSM } from 'aws-sdk';

// function to get SSM Parameterstor Securestring value
export async function getSSMSecureString(parameterName: string, region: string): Promise<string> {

    let secureStringValue: string;
    secureStringValue='';
    const ssm = new SSM({
        region: region
    }); // Create an SSM client

    // Define parameters for the getParameter request
    const params = {
        Name: parameterName,
        WithDecryption: true, // Decrypt the SecureString value
    };

    // Call the getParameter method to retrieve the SecureString value
    await ssm.getParameter(params, (err, data) => {
        if (err) {
            console.error('ERROR with', parameterName, 'in', region, '-', err);
        } else {
            if (data.Parameter && data.Parameter.Value) {
                secureStringValue = data.Parameter.Value;
                // console.log(`SecureString Value: ${secureStringValue}`);
            } else {
                console.error(`Parameter '${parameterName}' not found.`);
            }
        }
    }).promise();

    return secureStringValue;

}