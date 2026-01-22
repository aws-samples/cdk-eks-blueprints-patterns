# Union.ai on EKS Pattern

Union.ai empowers AI development teams to rapidly ship high-quality code to production by offering optimized performance, unparalleled resource efficiency, and a delightful workflow authoring experience. With Union.ai your team can:

- Run complex AI workloads with performance, scale, and efficiency.
- Achieve millisecond-level execution times with reusable containers.
- Scale out to multiple regions, clusters, and clouds as needed for resource availability, scale, or compliance.

Union.ai’s modular architecture allows for great flexibility and control. The customer can decide how many clusters to have, their shape, and who has access to what. All communication is encrypted.

<p align="center">
  <a href="https://www.union.ai">
    <img alt="Union Self-managed Architecture" src="https://www.union.ai/docs/v1/selfmanaged/_static/images/deployment/architecture.svg" width="600" />
  </a>
</p>


## Prerequisites

Ensure that you have installed the following tools on your machine:

- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html) (also ensure it is [configured](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-quickstart.html#getting-started-quickstart-new))
- [cdk](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html#getting_started_install)
- [npm](https://docs.npmjs.com/cli/v8/commands/npm-install)
- [tsc](https://www.typescriptlang.org/download)
- [make](https://www.gnu.org/software/make/)
- uctl

### Installing `uctl`

On Mac:
```bash
brew tap unionai/homebrew-tap
brew install uctl
```

With cURL:
```bash
curl -sL https://raw.githubusercontent.com/unionai/uctl/main/install.sh | bash
```

## Deployment

### Setup Union Credentials

Both the control plane URL and cluster name will be provided by Union.  Union will also provide authentication information for your account to access the hosted control plane.

```bash
export UNION_CONTROL_PLANE_URL=<YOUR_UNION_CONTROL_PLANE_URL>
export UNION_CLUSTER_NAME=<YOUR_SELECTED_CLUSTER_NAME>
export UNION_ORG_NAME=<YOUR_SELECTED_ORG_NAME>

uctl config init --host=$UNION_CONTROL_PLANE_URL
uctl selfserve provision-dataplane-resources --clusterName $UNION_CLUSTER_NAME --provider aws
```

This command will output the ID, name, and secret used by Union services to communicate with the control plane.

### Create Union Secrets in AWS Secrets Manager

```bash
export UNION_CLIENT_ID_SECRET_NAME=union-client-id
export UNION_CLIENT_ID_SECRET_VALUE=<CLUSTERAUTHCLIENTID_FROM_SELFSERVE_COMMAND>

aws secretsmanager create-secret --name $UNION_CLIENT_ID_SECRET_NAME --secret-string $UNION_CLIENT_ID_SECRET_VALUE

export UNION_SECRET_SECRET_NAME=union-client-secret
export UNION_SECRET_SECRET_VALUE=<CLUSTERAUTHCLIENTSECRET_FROM_SELFSERVE_COMMAND>

aws secretsmanager create-secret --name $UNION_SECRET_SECRET_NAME --secret-string $UNION_SECRET_SECRET_VALUE
```

### Clone the repository:

```sh
git clone https://github.com/aws-samples/cdk-eks-blueprints-patterns.git
cd cdk-eks-blueprints-patterns
```

Set the pattern's parameters in the CDK context by overriding the _cdk.json_ file:

```sh
cat << EOF > cdk.json
{
    "app": "npx ts-node dist/lib/common/default-main.js",
    "context": {
      "union.orgName": "${UNION_ORG_NAME}",
      "union.secrets.clientId": "${UNION_CLIENT_ID_SECRET_NAME}",
      "union.secrets.clientSecret": "${UNION_SECRET_SECRET_NAME}",
      "union.clusterName": "${UNION_CLUSTER_NAME}",
      "union.host": "${UNION_CONTROL_PLANE_URL}"
    }
}
EOF
```

### Run the following commands:

```sh
make deps
make build
make pattern unionai deploy
```

### Validation

Run the command:
```bash
kubectl get deploy -A
```

Output should be:
```bash
NAMESPACE     NAME                                                  READY   UP-TO-DATE   AVAILABLE   AGE
kube-system   blueprints-addon-metrics-server                       1/1     1            1           57d
kube-system   blueprints-addon-union-dataplane-kube-state-metrics   1/1     1            1           57d
unionai       executor                                              1/1     1            1           57d
unionai       flytepropeller                                        1/1     1            1           57d
unionai       flytepropeller-webhook                                1/1     1            1           57d
unionai       opencost                                              1/1     1            1           57d
unionai       prometheus-operator                                   1/1     1            1           57d
unionai       syncresources                                         1/1     1            1           57d
unionai       union-operator                                        1/1     1            1           57d
unionai       union-operator-proxy                                  1/1     1            1           57d
```

To validate the cluster has been successfully registered to the Union control plane run the command:
```bash
uctl get cluster
```

Output should be:
```bash
 ----------- ------- --------------- -----------
| NAME      | ORG   | STATE         | HEALTH    |
 ----------- ------- --------------- -----------
| <cluster> | <org> | STATE_ENABLED | HEALTHY   |
 ----------- ------- --------------- -----------
1 rows
```

### 8. Register and run example workflows

```bash
uctl register examples --project=union-health-monitoring --domain=development
uctl validate snacks --project=union-health-monitoring --domain=development
 ---------------------- ----------------------------------- ---------- -------------------------------- -------------- ----------- ---------------
| NAME                 | LAUNCH PLAN NAME                  | VERSION  | STARTED AT                     | ELAPSED TIME | RESULT    | ERROR MESSAGE |
 ---------------------- ----------------------------------- ---------- -------------------------------- -------------- ----------- ---------------
| alskkhcd6wx5m6cqjlwm | basics.hello_world.hello_world_wf | v0.3.341 | 2025-05-09T18:30:02.968183352Z | 4.452440953s | SUCCEEDED |               |
 ---------------------- ----------------------------------- ---------- -------------------------------- -------------- ----------- ---------------
1 rows
```
