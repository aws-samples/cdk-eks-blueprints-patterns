import 'source-map-support/register';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import { Construct } from 'constructs';
import { HelmAddOnUserProps } from '@aws-quickstart/eks-blueprints';

/*
* User provided options for the Helm Chart
*/
export interface GitlabRunnerAddonProps extends HelmAddOnUserProps {
 /**
  * To Create Namespace using CDK
  */    
 createNamespace?: boolean;
}

const defaultProps: blueprints.HelmAddOnProps & GitlabRunnerAddonProps = {
    name: 'gitlab-runner',
    chart: 'gitlab-runner',
    namespace: 'gitlab-runner',
    repository: 'https://charts.gitlab.io/',
    release: 'gitlab-runner',
    version: 'v0.55.0',
    createNamespace: true,
    values: {
        gitlabUrl: "https://gitlab.com/",
        runnerRegistrationToken: "<runner registration token>",
        rbac: {
          create: true,
        },
        runners: {
          privileged: true,
          builds: {
            cpuRequests: "1",
            cpuRequestsOverwriteMaxAllowed: "16",
            cpuLimitOverwriteMaxAllowed: "16",
            memoryRequests: "4Gi",
            memoryLimitOverwriteMaxAllowed: "16Gi",
            memoryRequestsOverwriteMaxAllowed: "16Gi",
          },
        },
      },
};

export class GitlabRunnerHelmAddon extends blueprints.HelmAddOn {

    readonly options: GitlabRunnerAddonProps;

    constructor(props?: GitlabRunnerAddonProps) {
      super({...defaultProps, ...props});
      this.options = this.props as GitlabRunnerAddonProps;
    }
    
    deploy(clusterInfo: blueprints.ClusterInfo): void | Promise<Construct> {
        const chart = this.addHelmChart(clusterInfo, this.props, true);
        return Promise.resolve(chart);
    }
}