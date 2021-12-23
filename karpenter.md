# Karpenter

https://karpenter.sh/docs/getting-started/

export CLUSTER_NAME=bottlerocket-blueprint

## Tag Subnets

Karpenter discovers subnets tagged kubernetes.io/cluster/\$CLUSTER_NAME. Add this tag to subnets associated configured for your cluster. Retreive the subnet IDs and tag them with the cluster name.

```bash
aws cloudformation describe-stacks \
    --stack-name ${CLUSTER_NAME} \
    --query 'Stacks[].Outputs[?OutputKey==`SubnetsPrivate`].OutputValue' \
    --output text
```

## Create Karpender IAM Roles

```bash
TEMPOUT=$(mktemp)
curl -fsSL https://karpenter.sh/docs/getting-started/cloudformation.yaml > $TEMPOUT \
&& aws cloudformation deploy \
  --stack-name Karpenter-${CLUSTER_NAME} \
  --template-file ${TEMPOUT} \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides ClusterName=${CLUSTER_NAME}
```

helm repo add karpenter https://charts.karpenter.sh
helm repo update
helm upgrade --install karpenter karpenter/karpenter --namespace kube-system \
 --create-namespace --set serviceAccount.create=false --version 0.4.3 \
 --set controller.clusterName=${CLUSTER_NAME} \
  --set controller.clusterEndpoint=$(aws eks describe-cluster --name \${CLUSTER_NAME} --query "cluster.endpoint" --output json) \
 --set defaultProvisioner.create=false \
 --wait

## Create Provisioner

cat <<EOF | kubectl apply -f -
apiVersion: karpenter.sh/v1alpha5
kind: Provisioner
metadata:
name: default
spec:
requirements: - key: karpenter.sh/capacity-type
operator: In
values: ["spot"]
provider:
instanceProfile: KarpenterNodeInstanceProfile-\${CLUSTER_NAME}
ttlSecondsAfterEmpty: 30
EOF
