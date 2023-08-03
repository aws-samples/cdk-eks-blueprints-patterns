import 'source-map-support/register';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import { Construct } from 'constructs';
import merge from "ts-deepmerge";
import { HelmAddOnUserProps, Values } from '@aws-quickstart/eks-blueprints';
import { setPath } from '@aws-quickstart/eks-blueprints/dist/utils/object-utils';

export enum CpuArch {
    ARM_64 = 'arm64',
    X86_64 = 'amd64'
}

/*
* User provided options for the Helm Chart
*/
export interface GitlabRunnerAddonProps extends HelmAddOnUserProps {
 /**
  * To Create Namespace using CDK
  */    
 createNamespace?: boolean;
/** 
  * The CPU architecture of the node on which the runner pod will reside
  */
  arch: CpuArch
/** 
  * The GitLab API URL 
  */ 
  gitlabUrl?: string
/** 
 *Kubernetes Secret containing the runner registration token (discussed later)
 */
 secretName?: string
}

const defaultProps: blueprints.HelmAddOnProps & GitlabRunnerAddonProps = {
    name: 'gitlab-runner',
    chart: 'gitlab-runner',
    namespace: 'gitlab',
    repository: 'https://charts.gitlab.io/',
    release: 'gitlab-runner',
    version: 'v0.40.1',
    createNamespace: true,
    arch: CpuArch.X86_64,
    gitlabUrl: "https://gitlab.com/",
    secretName: "gitlab-runner",
    values: {}
};

export class GitlabRunnerHelmAddon extends blueprints.HelmAddOn {

    readonly options: GitlabRunnerAddonProps;

    constructor(props?: GitlabRunnerAddonProps) {
        super({...defaultProps, ...props});
        this.options = this.props as GitlabRunnerAddonProps;
    }
    
    deploy(clusterInfo: blueprints.ClusterInfo): void | Promise<Construct> {
        let values: Values = this.populateValues(this.options);
        values = merge(values, this.props.values ?? {});
        const chart = this.addHelmChart(clusterInfo, values, true);
        return Promise.resolve(chart);
    }

    /**
   * populateValues populates the appropriate values used to customize the Helm chart
   * @param helmOptions User provided values to customize the chart
   */
    populateValues(helmOptions: GitlabRunnerAddonProps): Values {
        const values = helmOptions.values ?? {};
        setPath(values,"runners.config", this.runnerConfig(this.options.arch));
        setPath(values,"runners.privileged", true);
        setPath(values,"runners.name", `demo-runner-${this.options.arch}`);
        setPath(values,"runners.secret", this.options.secretName);
        setPath(values,"runners.builds.cpuRequests", "1");
        setPath(values,"runners.builds.cpuRequestsOverwriteMaxAllowed", "16");
        setPath(values,"runners.builds.cpuLimitOverwriteMaxAllowed", "16");
        setPath(values,"runners.builds.memoryRequests", "4Gi");
        setPath(values,"runners.builds.memoryRequestsOverwriteMaxAllowed", "16Gi");
        setPath(values,"runners.builds.memoryLimitOverwriteMaxAllowed", "16Gi");
        setPath(values,"runners.builds.memoryRequestsOverwriteMaxAllowed", "16Gi");
        setPath(values,"namespace", "gitlab");
        setPath(values,"nodeSelector", {
            'kubernetes.io/arch': this.options.arch,
            'karpenter.sh/capacity-type': 'on-demand'
        });
        setPath(values,"podLabels", {
            'gitlab-role': 'manager'
        });
        setPath(values,"rbac", {
            create: true
        });
        setPath(values,"resources", {
            requests: {
                memory: '128Mi',
                cpu: '256m'
            }
        });
        return values;
    }

    /** This string contains the runner's `config.toml` file including the
   * Kubernetes executor's configuration. Note the nodeSelector constraints 
   * (including the use of Spot capacity and the CPU architecture).
   */
    runnerConfig(arch: CpuArch): string {
        return `
[[runners]]
  [runners.kubernetes]
    namespace = "{{.Release.Namespace}}"
    image = "ubuntu:16.04"
  [runners.kubernetes.node_selector]
    "kubernetes.io/arch" = "${arch}"
    "kubernetes.io/os" = "linux"
    "karpenter.sh/capacity-type" = "spot"
  [runners.kubernetes.pod_labels]
    gitlab-role = "runner"
    `.trim();
    }
}