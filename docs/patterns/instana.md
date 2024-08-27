# IBM Instana on EKS pattern
The IBM® Instana® Addon for Amazon EKS Blueprint is designed to enhance observability, monitoring, and management capabilities for applications running on Amazon Elastic Kubernetes Service (EKS). Instana Addon focuses on enhancing the user experience by reducing the complexity and time required to install and configure an Instana host agent on Amazon EKS cluster.

This Addon will use IBM® Instana® Agent Operator in the namespace ```instana-agent``` to install and manage Instana Agent. It also configures custom resource values to configure the operator.

This pattern deploys the following resources:

- Creates EKS Cluster Control plane with public endpoint (for demo purpose only) with a managed node group
- Install and set up Instana Agent for monitoring your EKS workloads. (by using the provided environment variable and additional configuration parameters)


## Prerequisites:

Ensure that you have installed the following tools on your machine.

1. [aws cli](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)
2. [kubectl](https://Kubernetes.io/docs/tasks/tools/)
3. [cdk](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html#getting_started_install)
4. [npm](https://docs.npmjs.com/cli/v8/commands/npm-install)
5. Instana backend application - Use SaaS (eg [aws](https://aws.amazon.com/marketplace/pp/prodview-hnqy5e3t3fzda?sr=0-1&ref_=beagle&applicationId=AWSMPContessa)) or Install self-hosted Instana backend ([on-premises](https://www.ibm.com/docs/en/instana-observability/current?topic=installing-configuring-self-hosted-instana-backend-premises))

## Project Setup
Clone the repository

```sh
git clone https://github.com/aws-samples/cdk-eks-blueprints-patterns.git
```

Go inside project directory (eg. cdk-eks-blueprints-patterns)

```sh
cd cdk-eks-blueprints-patterns
```

Install project dependencies.

```sh
make deps
```


## Instana Agent Configuration
Go to your Instana Backend application (Instana User Interface), click ... More > Agents > Installing Instana Agents and select 'Kubernetes' platform to get the Instana Agent Key, Instana Service Endpoint, Instana Service port. These steps are also described on the screenshot below.

[Instana Agent Configuration](./images/instana-agent.png)


## Usage : Using AWS Secret Manager Secrets 
### AWS Secret Manager Secrets (Optional)
If you wish to use AWS Secret Manager Secrets to pass Instana props (key, endpoint, and port), then you will be required to setup Secrets first.

```shell
export SECRET_NAME=<aws_secret_name>
export INSTANA_AGENT_KEY=<instana_key>
export INSTANA_ENDPOINT_HOST_URL=<instana_host_endpoint>
export INSTANA_ENDPOINT_HOST_PORT=<instana_port>"
aws secretsmanager create-secret \
  --name $SECRET_NAME \
  --secret-string "{\"INSTANA_AGENT_KEY\":\"${INSTANA_AGENT_KEY}\",
    \"INSTANA_ENDPOINT_HOST_URL\":\"${INSTANA_ENDPOINT_HOST_URL}\",
    \"INSTANA_ENDPOINT_HOST_PORT\":\"${INSTANA_ENDPOINT_HOST_PORT}\"
   }"
```
secret_name = AWS Secret Manager Secret name (eg. *instana-secret-params*).


### Using AWS Secret Manager Secrets
To use AWS Secret Manager Secrets follow these steps:

1. The actual settings for the secret name (```secretParamName```) are expected to be specified in the CDK context. Generically it is inside the cdk.context.json file of the current directory or in `~/.cdk.json` in your home directory.

	 Example settings: Update the context in `cdk.json` file located in `cdk-eks-blueprints-patterns` directory
	 ```json
	"context": {
         "secretParamName": "instana-secret-params"
     }
    ```

2. Go to project/lib/instana-construct/index.ts

```typescript
import { loadYaml } from "@aws-quickstart/eks-blueprints/dist/utils";
import * as cdk from "aws-cdk-lib";
import { InstanaOperatorAddon } from "@instana/aws-eks-blueprint-addon";
import { EksBlueprint, utils } from "@aws-quickstart/eks-blueprints";
import { prevalidateSecrets } from "../common/construct-utils";

export const instanaProps: { [key: string]: any } = {};

export default class InstanaConstruct {
    async buildAsync(scope: cdk.App, id: string) {
        try {
            await prevalidateSecrets(InstanaConstruct.name, undefined, 'instana-secret-params');

            const secretParamName: string = utils.valueFromContext(scope, "secretParamName", undefined);
            if(secretParamName != undefined) {
                instanaProps.secretParamName = secretParamName;
            }
            const yamlObject = loadYaml(JSON.stringify(instanaProps));
            const stackId = `${id}-blueprint`;
            const addOns = new InstanaOperatorAddon(yamlObject);
            EksBlueprint.builder()
                .account(process.env.CDK_DEFAULT_ACCOUNT!)
                .region(process.env.CDK_DEFAULT_REGION!)
                .addOns(addOns)
                .build(scope, stackId);
            console.log("Blueprint built successfully.");
        } catch (error) {
            console.error("Error:", error);
            throw new Error(`environment variables must be setup for the instana-operator pattern to work`);
        }
    }
}
```

## Usage : Using Secrets in the Code

### Setting up environment variable
To set the following environment variables from the CLI, use the corresponding values obtained from the Instana Service Endpoint and Port (as shown in the above screenshot), and the Instana Application Key (also shown in the above screenshot):

- Set the value of **INSTANA_ENDPOINT_HOST_URL** to the Instana Service Endpoint.
- Set the value of **INSTANA_ENDPOINT_HOST_PORT** to the Instana Service Port.
- Set the value of **INSTANA_AGENT_KEY** to the Instana Application Key.

Set the value of the following environment variable and run it on CLI to set those variables.

For an example:

```shell
export INSTANA_AGENT_KEY=abc123
export INSTANA_ENDPOINT_HOST_URL=instana.example.com
export INSTANA_ENDPOINT_HOST_PORT="443"
```

### Configure additional configuration parameters.
To configure additional parameters for Instana Agent according to your specific use case, follow these steps:

- Go to project/lib/instana-construct/index.ts
- Add the additional configuration parameters under ```const instanaProps``` variable.

For an example:

```typescript
export const instanaProps = {
 agent: {
    key: process.env.INSTANA_AGENT_KEY,// Mandatory Parameter
    endpointHost: process.env.INSTANA_ENDPOINT_HOST_URL,//Mandatory Parameter
    endpointPort: process.env.INSTANA_ENDPOINT_HOST_PORT, // Mandatory Parameter,
    env: {
		INSTANA_AGENT_TAGS: "staging",
    }
  }
};
```


## Deploy EKS Cluster with Amazon EKS Blueprints for CDK

To view patterns and deploy ```instana-operator``` pattern

```sh
make deps
make build
cdk bootstrap
make pattern instana-operator deploy
```


## Verify the resources

Run update-kubeconfig command. You should be able to get the command from CDK output message. More information can be found at https://aws-quickstart.github.io/cdk-eks-blueprints/getting-started/#cluster-access
```sh
aws eks update-kubeconfig --name <your cluster name> --region <your region> --role-arn arn:aws:iam::xxxxxxxxx:role/eks-blue1-eksblue1AccessRole32C5DF05-1NBFCH8INI08A
```

Lets verify the resources created by Steps above.
```sh
kubectl get pods -n instana-agent # Output shows the EKS Managed Node group nodes under instana-agent namespace
```
Output of the above command will be silimar to below one:

```output
NAMESPACE       NAME                                  				READY   	STATUS    RESTARTS   AGE
instana-agent   controller-manager-78479cb596-sktg9   	1/1     	Running   					0          56m
instana-agent   controller-manager-78479cb596-xz8kn   	1/1     	Running   					0          56m
instana-agent   instana-agent-gsqx8                   				1/1     	Running   					0          56m
```
Run following command to verify Instana Agent logs
```shell
kubectl logs <instana-agent-pod-name> -n instana-agent # Output shows instana agent logs. pod name in this example is instana-agent-gsqx8
```


## Cleanup

To clean up your EKS Blueprints, run the following commands:

```sh
make pattern instana-operator destroy 

```

## Disclaimer 
This pattern relies on an open source NPM package [aws-eks-blueprint-addon](https://www.npmjs.com/package/%40instana/aws-eks-blueprint-addon). Please refer to the package npm site for more information.
```
https://www.npmjs.com/package/@instana/aws-eks-blueprint-addon'
```
If you have any questions about the npm package or find any defect, please post in the source repo at:
https://github.com/instana/instana-eks-blueprint-addon/issues
