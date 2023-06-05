import { BatchEksTeam, BatchEnvType, BatchAllocationStrategy } from "@aws-quickstart/eks-blueprints";

export const batchTeam = new BatchEksTeam({
    name: "batch-team-a",
    namespace: "aws-batch",
    envName: "batch-team-a-comp-env",
    computeResources:{
        envType: BatchEnvType.EC2,
        allocationStrategy: BatchAllocationStrategy.BEST,
        priority: 10,
        minvCpus: 1,
        maxvCpus: 128,
        instanceTypes: ["m5", "c4.2xlarge"]
    },
    jobQueueName: "batch-team-a-job-queue"
});