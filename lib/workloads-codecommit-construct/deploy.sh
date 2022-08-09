echo Deploying blueprint ...
cdk deploy workloads-codecommit-dev-blueprint-us-west-1 --require-approval never
export KUBE_CONFIG=$(aws cloudformation describe-stacks --stack-name workloads-codecommit-dev-blueprint-us-west-1 | jq -r '.Stacks[0].Outputs[] | select(.OutputKey|match("ConfigCommand"))| .OutputValue')
$KUBE_CONFIG

echo Getting ArgoCD server url ...
until kubectl get svc blueprints-addon-argocd-server -n argocd -o json | jq --raw-output '.status.loadBalancer.ingress[0].hostname' | grep -m 1 "elb.amazonaws.com"; do sleep 5 ; done;
export ARGOCD_SERVER=`kubectl get svc blueprints-addon-argocd-server -n argocd -o json | jq --raw-output '.status.loadBalancer.ingress[0].hostname'`

export ARGOCD_USER=argocd
export CC_REPO_NAME=eks-blueprints-workloads-cc
echo Deploying AWS CodeCommit stack ...
cdk deploy workloads-codecommit-repo-eks-blueprints-workloads-cc --parameters argoCDUrl=$ARGOCD_SERVER --require-approval never

aws iam create-service-specific-credential --user-name $ARGOCD_USER --service-name codecommit.amazonaws.com
export CC_REPO_URL=$(aws codecommit get-repository --repository-name $CC_REPO_NAME --query 'repositoryMetadata.cloneUrlHttp' --output text)
export SSC_ID=$(aws iam list-service-specific-credentials --user-name $ARGOCD_USER --query 'ServiceSpecificCredentials[0].ServiceSpecificCredentialId' --output text)
export SSC_USER=$(aws iam list-service-specific-credentials --user-name $ARGOCD_USER --query 'ServiceSpecificCredentials[0].ServiceUserName' --output text)
export SSC_PWD=$(aws iam reset-service-specific-credential --user-name $ARGOCD_USER --service-specific-credential-id $SSC_ID --query 'ServiceSpecificCredential.ServicePassword' --output text)

cat > argocd-workloads-repos-creds.yaml <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: repo-creds-platform-https
  namespace: argocd
  labels:
    argocd.argoproj.io/secret-type: repo-creds
stringData:
  url: ${CC_REPO_URL}
  password: ${SSC_PWD}
  username: ${SSC_USER}
EOF

kubectl apply -f argocd-workloads-repos-creds.yaml
rm argocd-workloads-repos-creds.yaml

pushd ..
git clone https://github.com/aws-samples/eks-blueprints-workloads.git
git clone https://git-codecommit.us-west-1.amazonaws.com/v1/repos/eks-blueprints-workloads-cc

rsync -av eks-blueprints-workloads/ eks-blueprints-workloads-cc --exclude .git
cd eks-blueprints-workloads-cc
git add . && git commit -m "initial commit" && git push
echo Deployment finished.
echo AWS CodeCommit Blueprint workloads repository URL: $CC_REPO_URL
echo ArgoCD server URL: https://$(kubectl get svc blueprints-addon-argocd-server -n argocd -o json | jq --raw-output '.status.loadBalancer.ingress[0].hostname')
echo ArgoCD server user: admin 
echo ArgoCD server password: $(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d)
popd
