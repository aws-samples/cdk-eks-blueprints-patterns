# Windows Nodes on EKS

We (AWS) have received many requests to add windows node group support from the customers who run their workloads on Windows. Customers want to scale these workloads on Kubernetes alongside their Linux workloads. Amazon EKS supports windows node groups and you can Windows worker node group to an Amazon EKS cluster. This pattern Creates EKS Cluster Control plane with a managed node group running windows node. Please check our AWS doc on [Enabling Windows support for your Amazon EKS cluster](https://docs.aws.amazon.com/eks/latest/userguide/windows-support.html) to learn more about considerations, prerequisites on running windows nodes with EKS cluster. Also please refer to this AWS doc to learn about [Amazon EKS optimized Windows AMIs](https://docs.aws.amazon.com/eks/latest/userguide/eks-optimized-windows-ami.html).

### Addons
Not all of the listed EKS addons support windows. We are currently working on a list of supported addons documentation which will be published [here](https://github.com/aws-quickstart/cdk-eks-blueprints/blob/main/docs/addons/index.md).

## Prerequisites

Ensure that you have installed the following tools on your machine.

1. [aws cli](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)
2. [kubectl](https://Kubernetes.io/docs/tasks/tools/)
3. [cdk](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html#getting_started_install)
4. [npm](https://docs.npmjs.com/cli/v8/commands/npm-install)
5. `make`

## Configuration Options

The pattern exposes the `WindowsBuilder` construct to build cluster with windows node groups. At the moment, adding windows nodes to the cluster requires at least one linux node group present to deploy core add-ons, such as VPC-CNI and CoreDNS. 

The `WindowsBuilder` provides a set of options, most of which are similar to managed node groups. 

In addition, it provides an attribute `noScheduleForWindowsNodes : true | false`. When set to `true` it will automatically add a `NoSchedule` taint to the Windows nodes. This approach is a safe way to disallow any application that does not provide proper tolerations to be scheduled on Windows nodes. 

In this scenario, in order to schedule a workload (application/add-on) on Windows nodes, customers can apply the following node selectors and tolerations to their deployments:

```yaml
nodeSelector:
  kubernetes.io/os: windows
tolerations:
  - key: "os"
    operator: "Equal"
    value: "windows"
    effect: "NoSchedule"
```

## Deploy EKS Cluster with Amazon EKS Blueprints for CDK

Clone the repository

```sh
git clone https://github.com/aws-samples/cdk-eks-blueprints-patterns.git
cd cdk-eks-blueprints-patterns
```

Updating npm

```sh
npm install -g npm@latest
```

To view patterns and deploy kubeflow pattern

```sh
make list
npx cdk bootstrap
make pattern windows deploy
```

## Verify the resources

Run the update-kubeconfig command. You should be able to get the command from the CDK output message. More information can be found at https://aws-quickstart.github.io/cdk-eks-blueprints/getting-started/#cluster-access

```sh
aws eks update-kubeconfig --name windows-eks-blueprint --region <your region> --role-arn arn:aws:iam::xxxxxxxxx:role/windows-construct-bluepr-windowsconstructbluepri-1OZNO42GH3OCB
```

Let's verify the resources created from the steps above.

```sh
kubectl get nodes -o json | jq -r '.items[] | "Name: ",.metadata.name,"\nInstance Type: ",.metadata.labels."beta.kubernetes.io/instance-type","\nOS Type: ",.metadata.labels."beta.kubernetes.io/os","\n"' # Output shows Windows and Linux Nodes
```

## Deploy sample windows application

Create a namespace for the windows app called windows

```sh
kubectl create ns windows
```

Create a yaml file for the app from the configuration below and save it as windows-server-2022.yaml

```yaml
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: windows-server-iis-ltsc2022
  namespace: windows
spec:
  selector:
    matchLabels:
      app: windows-server-iis-ltsc2022
      tier: backend
      track: stable
  replicas: 2
  template:
    metadata:
      labels:
        app: windows-server-iis-ltsc2022
        tier: backend
        track: stable
    spec:
      containers:
      - name: windows-server-iis-ltsc2022
        image: mcr.microsoft.com/windows/servercore/iis:windowsservercore-ltsc2022
        ports:
        - name: http
          containerPort: 80
        imagePullPolicy: IfNotPresent
        command:
        - powershell.exe
        - -command
        - "Add-WindowsFeature Web-Server; Invoke-WebRequest -UseBasicParsing -Uri 'https://dotnetbinaries.blob.core.windows.net/servicemonitor/2.0.1.6/ServiceMonitor.exe' -OutFile 'C:\\ServiceMonitor.exe'; echo '<html><body><br/><br/><H1>Our first pods running on Windows managed node groups! Powered by Windows Server LTSC 2022.<H1></body><html>' > C:\\inetpub\\wwwroot\\iisstart.htm; C:\\ServiceMonitor.exe 'w3svc'; "
      nodeSelector:
        kubernetes.io/os: windows
      tolerations:
          - key: "os"
            operator: "Equal"
            value: "windows"
            effect: "NoSchedule"
---
apiVersion: v1
kind: Service
metadata:
  name: windows-server-iis-ltsc2022-service
  namespace: windows
spec:
  ports:
  - port: 80
    protocol: TCP
    targetPort: 80
  selector:
    app: windows-server-iis-ltsc2022
    tier: backend
    track: stable
  sessionAffinity: None
  type: LoadBalancer
```

Deploy the sample app

```sh
kubectl apply -f windows-server-2022.yaml
```

Verify the resources created successfully

```sh
kubectl get -n windows svc,deploy,pods
```

### Reference

Please reference our [blog](https://aws.amazon.com/blogs/containers/deploying-amazon-eks-windows-managed-node-groups/#:~:text=2.-,Deploy%20a%20sample%20application,-Now%20that%20ourhttps://aws.amazon.com/blogs/containers/deploying-amazon-eks-windows-managed-node-groups/#:~:text=2.-,Deploy%20a%20sample%20application,-Now%20that%20our) on Deploying Amazon EKS Windows managed node groups to learn more about this topic.


## Cleanup

First delete the windows app

```sh
kubectl delete -f windows-server-2022.yaml
kubectl delete ns windows
```

To clean up your EKS Blueprint, run the following command:

```sh
make pattern windows destroy
```
