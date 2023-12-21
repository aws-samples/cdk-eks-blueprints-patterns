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

InstallTools() {
    #Install yq 
    VERSION='v4.40.2'
    if [ ${ARCH} == "x86_64" ] ; then 
        ARCH_yq="amd64"
    else
        echo "Hello"
    fi
    BINARY="yq_linux_$ARCH_yq"
    wget https://github.com/mikefarah/yq/releases/download/${VERSION}/${BINARY}.tar.gz -O - | tar xz && sudo mv ${BINARY} /usr/local/bin/yq
    sudo chmod 755 /usr/local/bin/yq
    
    #Install kubectl-slice
    BINARY="kubectl-slice_linux_$ARCH"
    wget https://github.com/patrickdappollonio/kubectl-slice/releases/download/v1.2.7/${BINARY}.tar.gz -O - | tar xz && sudo mv kubectl-slice /usr/local/bin/kubectl-slice
    sudo chmod 755 /usr/local/bin/kubectl-slice
    
    #Ensure PATH variable is updated 
    PATH=$PATH:/usr/local/bin
}

SplitFiles() {
    echo "Splitting File $1 if required"
    file_path=$1
    file_name=`echo ${file_path}|awk -F"/" '{print $NF}'`
    file_dir=`dirname ${file_path}`
    output_dir=`echo ${file_name}|awk -F"." '{print $1}'`
    mkdir -p ${file_dir}/${output_dir}
    kubectl-slice -f ${file_path} -o ${file_dir}/${output_dir}
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
    echo ${pvc_name}
    pvc_namespace=`yq -r '.metadata.namespace' ${file_path}`
    if [ ${pvc_namespace} == "null" ]; then
        pvc_namespace="default"
    fi
    echo ${pvc_namespace}
    snapshot_id=`aws ec2 describe-snapshots --filters Name=tag:kubernetes.io/created-for/pvc/name,Values=${pvc_name} --query "Snapshots[?(StartTime>='$(date --date='-1 day' '+%Y-%m-%d')' && State=='completed')].{ID:SnapshotId,Time:StartTime,State:State}"|jq .[0].ID`
    echo "Found Snapshot with ${snapshot_id}"
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
echo "Updated Manifest ${file_path}"
echo "------------------------------------------------------------------------"
}


#Main Program 
if [ $# -ne 1 ]; then 
    usage
fi
checkManifest
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
    echo "Checking if file ${newfile} is a PVC definition"
    manifest_kind=`yq -r '.kind' ${newfile}`
    if [ ${manifest_kind} == "PersistentVolumeClaim" ]; then 
        UpdateManifest ${newfile}
    fi
done