#!/bin/bash 
##################################################
#
# Title  : update_pvc.sh
# Desc   : The script updates the PVC Definition to restore from Latest snapshot
# Usage  : update_pvc.sh <Manifest Folder>
##################################################
# Local Variables 
##################
PROCNAME=`basename $0`
MANIFEST_FOLDER=$1
ARCH=`uname -m`
declare -A KMSKeys
declare -A PolicyResources
declare -A NewResources

# Functions
##################
usage() {
    echo "${PROCNAME} <Local Manifest Folder absolute path> (eg: $PROCNAME /data/manifest)"
}

checkManifest() {
    if [ ! -d ${MANIFEST_FOLDER} ]; then
        echo "Manifest Folder does not exist"
        usage
        exit 100
    fi
    fc=`echo ${MANIFEST_FOLDER}|head -c 1`
    if [ ${fc} != "/" ]; then 
        echo "Manifest folder should be an absolute path and not relative"
        usage
        exit 100
    fi
}

backupManifest() {
    folder_name=`echo ${MANIFEST_FOLDER}|sed 's/\/$//'|awk -F"/" '{print $NF}'`
    folder_dir=`dirname ${MANIFEST_FOLDER}`
    mkdir -p ${folder_dir}/${folder_name}.bkup
    cp -rp ${MANIFEST_FOLDER}/* ${folder_dir}/${folder_name}.bkup/
}

InstallTools() {
    #Install yq 
    VERSION='v4.40.2'
    if [ ${ARCH} == "x86_64" ] ; then 
        ARCH_yq="amd64"
    else
        echo "Hello"
    fi
    if [ ! -f /usr/local/bin/yq ]; then 
        BINARY="yq_linux_$ARCH_yq"
        wget https://github.com/mikefarah/yq/releases/download/${VERSION}/${BINARY}.tar.gz -O - | tar xz && sudo mv ${BINARY} /usr/local/bin/yq
        sudo chmod 755 /usr/local/bin/yq
    fi
    
    #Install kubectl-slice
    if [ ! -f /usr/local/bin/kubectl-slice ]; then 
        BINARY="kubectl-slice_linux_$ARCH"
        wget https://github.com/patrickdappollonio/kubectl-slice/releases/download/v1.2.7/${BINARY}.tar.gz -O - | tar xz && sudo mv kubectl-slice /usr/local/bin/kubectl-slice
        sudo chmod 755 /usr/local/bin/kubectl-slice
    fi 
    
    #Install jq
    if [ -f /usr/bin/yum ] && [ ! -f /usr/bin/jq ]; then 
        sudo yum install jq 
    elif [ -f /usr/bin/apt-get ] && [ ! -f /usr/bin/jq ]; then 
        sudo apt-get install jq
    elif [ ! -f /usr/bin/jq ]; then 
        echo "unable to install jq . Please install jq and rerun the script"
        exit 99
    fi
    
    #Install aws-cli 
    if [ ! -f /usr/local/bin/aws ]; then 
        curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
        unzip awscliv2.zip
        sudo ./aws/install
    fi 
    
    #Ensure PATH variable is updated 
    PATH=$PATH:/usr/local/bin
}

SplitFiles() {
    #echo "Splitting File $1 if required"
    file_path=$1
    file_name=`echo ${file_path}|awk -F"/" '{print $NF}'`
    file_dir=`dirname ${file_path}`
    output_dir=`echo ${file_name}|awk -F"." '{print $1}'`
    mkdir -p ${file_dir}/${output_dir}
    kubectl-slice -f ${file_path} -o ${file_dir}/${output_dir} >/dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "Successfully split the manifest file ${file_path}"
        rm -f $file_path
    fi
}

UpdateManifest() {
    file_path=$1
    echo "------------------------------------------------------------------------"
    echo "Updating Manifest ${file_path}"
    file_dir=`dirname ${file_path}`
    pvc_name=`yq -r '.metadata.name' ${file_path}`
    pvc_snapshot="${pvc_name}-snapshot"
    #echo ${pvc_name}
    pvc_namespace=`yq -r '.metadata.namespace' ${file_path}`
    if [ ${pvc_namespace} == "null" ]; then
        pvc_namespace="default"
    fi
    #echo ${pvc_namespace}
    snapshot_id=`aws ec2 describe-snapshots --filters Name=tag:kubernetes.io/created-for/pvc/name,Values=${pvc_name} --query "Snapshots[?(StartTime>='$(date --date='-1 day' '+%Y-%m-%d')' && State=='completed')].{ID:SnapshotId,Time:StartTime,State:State,KmsKey:KmsKeyId}" --output text|sort -k4 -r|awk -F" " '{print $1}'|head -1`
    snapshot_id=`echo ${snapshot_id}|sed 's/"//g'`
    kms_key=`aws ec2 describe-snapshots --snapshot-id ${snapshot_id}|jq .Snapshots[].KmsKeyId`
    if [[ ${KMSKeys[*]} =~ $kms_key ]]; then 
        echo 
    else
        KMSKeys[${#KMSKeys[@]}]=${kms_key}
    fi
    echo "Found Snapshot with snapshot id ${snapshot_id} for PVC  ${pvc_name} on namespace ${pvc_namespace}"
    if [ ${snapshot_id} != "null" ]; then 
        cat << EOF >> ${file_dir}/${pvc_name}-VolumeSnapshotContent.yaml
---
apiVersion: snapshot.storage.k8s.io/v1
kind: VolumeSnapshotContent
metadata:
 name: ${pvc_name}-content
spec:
 volumeSnapshotRef:
   kind: VolumeSnapshot
   namespace: ${pvc_namespace}
   name: ${pvc_name}-snapshot
 source:
   snapshotHandle: ${snapshot_id}
 driver: ebs.csi.aws.com
 deletionPolicy: Retain
 volumeSnapshotClassName: ebs-volume-snapclass
EOF
        cat << EOF >> ${file_dir}/${pvc_name}-VolumeSnapshot.yaml
---
apiVersion: snapshot.storage.k8s.io/v1
kind: VolumeSnapshot
metadata:
 name: ${pvc_name}-snapshot
 namespace: ${pvc_namespace}
spec:
 volumeSnapshotClassName: ebs-volume-snapclass
 source:
  volumeSnapshotContentName: ${pvc_name}-content
EOF
    pvc_snapshot=${pvc_snapshot} yq -i '.spec += {"dataSource":{"name": strenv(pvc_snapshot),"kind":"VolumeSnapshot","apiGroup":"snapshot.storage.k8s.io"}}' ${file_path}
    else
        echo "Unable to find the latest snapshot for PVC ${pvc_name}"
    fi   
#echo "Updated Manifest ${file_path}"
#echo "------------------------------------------------------------------------"
}

updateCSIRole() {
    echo "------------------------------------------------------------------------"
    echo "Updating the IAM policy attached to CSI Controller to access KMS Keys required for decrypting snapshots"
    csi_role=`kubectl get sa ebs-csi-controller-sa -o json -n kube-system|jq '.metadata.annotations."eks.amazonaws.com/role-arn"'|sed -e 's/"//g'|awk -F"/" '{print $NF}'`
    #resources=`echo ${KMSKeys[@]}|sed 's/ /\n/g'|sort -u|sed 's/$/,/g'`
    #export resources=`echo ${resources}|sed 's/,$//g'`
    #echo "******************************"
    #echo ${resources}
    #echo "******************************"
    #Checking if the resource is already part of an existing KMS policy 
    c_custompolicy=`aws iam list-attached-role-policies --role-name eks-blueprint-eksblueprintebscsicontrollersasaRole5-ML9ppOO45dPG --output text|awk -F" " '{print $NF}'|grep csi-controller-kmspolicy|wc -l`
    if [ ${c_custompolicy} -gt 0 ]; then 
        for policy_arn in `aws iam list-attached-role-policies --role-name eks-blueprint-eksblueprintebscsicontrollersasaRole5-ML9ppOO45dPG --output text|awk -F" " '{print $2}'|grep csi-controller-kmspolicy`
        do
            versionId=`aws iam get-policy --policy-arn ${policy_arn}|jq .Policy.DefaultVersionId|sed 's/"//g'`
            c_resource=`aws iam get-policy-version --version-id ${versionId} --policy-arn ${policy_arn}|jq .PolicyVersion.Document.Statement[0].Resource[]|wc -l`
            if [ ${c_resource} -gt 0 ]; then 
                for res in `aws iam get-policy-version --version-id ${versionId} --policy-arn ${policy_arn}|jq .PolicyVersion.Document.Statement[0].Resource[]`
                do 
                    PolicyResources[${#PolicyResources[@]}]=${res}
                done
            else [ ${c_resource} -eq 0 ]
                    PolicyResources[${#PolicyResources[@]}]=${res}
            fi
        done
        for n_res in ${KMSKeys[*]}
        do
            if [[ ${PolicyResources[*]} =~ ${n_res} ]]; then 
                echo "Resource ${n_res} already in policy skipping"
            else
                NewResources[${#NewResources[@]}]=${n_res}
            fi
        done
        resources=`echo ${NewResources[@]}|sed 's/ /\n/g'|sort -u|sed 's/$/,/g'`
        export resources=`echo ${resources}|sed 's/,$//g'`
        echo "******************************"
        echo ${resources}
        echo "******************************"
    else
        resources=`echo ${KMSKeys[@]}|sed 's/ /\n/g'|sort -u|sed 's/$/,/g'`
        export resources=`echo ${resources}|sed 's/,$//g'`
        echo "******************************"
        echo ${resources}
        echo "******************************"
    fi    
    a_res=`echo ${resources}|awk -F"," '{print NF}'`
    if [ ${a_res} -gt 0 ]; then 
        #create Iam_policy File 
        folder_dir=`dirname ${MANIFEST_FOLDER}`
        cat << EOF >> ${folder_dir}/kms_iam_policy.json
{
 "Version": "2012-10-17",
    "Statement": [

            {
			"Sid": "GrantAccess",
			"Effect": "Allow",
			"Action": [
				"kms:RevokeGrant",
				"kms:CreateGrant",
				"kms:ListGrants"
			],
			"Resource": [
				${resources}
			],
			"Condition": {
				"Bool": {
					"kms:GrantIsForAWSResource": "true"
				}
			}
		},
        {
            "Action": [
                "kms:Encrypt",
                "kms:Decrypt",
                "kms:ReEncrypt*",
                "kms:GenerateDataKey*",
                "kms:DescribeKey"
            ],
            "Resource": [ ${resources} ],
            "Effect": "Allow"
        }
        ]
}
EOF
        random=`cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 10 | head -n 1`
        aws iam create-policy \
        --policy-name csi-controller-kmspolicy-${random} \
        --policy-document file://${folder_dir}/kms_iam_policy.json
    
        if [ $? -eq 0 ]; then 
            rm -f ${folder_dir}/kms_iam_policy.json
        fi
    
        ACCOUNT_ID=`aws sts get-caller-identity|jq .Account|sed 's/"//g'`
    
        aws iam attach-role-policy \
        --role-name  ${csi_role} \
        --policy-arn arn:aws:iam::${ACCOUNT_ID}:policy/csi-controller-kmspolicy-${random}
    fi
}

#Main Program 
if [ $# -ne 1 ]; then 
    usage
fi
checkManifest
backupManifest
InstallTools
#Splitting files with multiple manifest files 
##############################################
for file in `find $MANIFEST_FOLDER -name "*.yaml"`
do 
    c_manifest=`cat ${file} | grep -c 'kind'`
    if [ ${c_manifest} -gt 1 ]; then 
        SplitFiles ${file} 
    else
        echo "${file} doesn't needs to be splitted"
    fi 
done
#Updating only the PersistentVolumeClaim Manifest files to use the latest snapshot taken before a day
for newfile in `find $MANIFEST_FOLDER -name "*.yaml"`
do
    #echo "Checking if file ${newfile} is a PVC definition"
    manifest_kind=`yq -r '.kind' ${newfile}`
    if [ ${manifest_kind} == "PersistentVolumeClaim" ]; then 
        UpdateManifest ${newfile}
    fi
done
#Updating CSI_Controller IAM role with KMS Permissions 
updateCSIRole