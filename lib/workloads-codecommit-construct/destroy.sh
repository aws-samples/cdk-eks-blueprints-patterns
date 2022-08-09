export ARGOCD_USER=argocd
export SSC_ID=$(aws iam list-service-specific-credentials --user-name $ARGOCD_USER --query 'ServiceSpecificCredentials[1].ServiceSpecificCredentialId' --output text)
aws iam delete-service-specific-credential --user-name $ARGOCD_USER --service-specific-credential-id $SSC_ID
export SSC_ID=$(aws iam list-service-specific-credentials --user-name $ARGOCD_USER --query 'ServiceSpecificCredentials[0].ServiceSpecificCredentialId' --output text)
aws iam delete-service-specific-credential --user-name $ARGOCD_USER --service-specific-credential-id $SSC_ID
aws iam delete-user --user-name $ARGOCD_USER
cdk destroy workloads-codecommit-repo-eks-blueprints-workloads-cc --force
pushd ..
rm -rf eks-blueprints-workloads-cc
rm -rf eks-blueprints-workloads
popd
cdk destroy workloads-codecommit-dev-blueprint-us-west-1 --force
cdk destroy workloads-codecommit-dev-blueprint-us-west-1 --force