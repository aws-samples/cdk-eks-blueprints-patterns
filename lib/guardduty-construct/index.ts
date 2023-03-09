import { aws_guardduty as guardduty, aws_events as events,
    aws_events_targets as eventTargets, aws_sns as sns,
    aws_sns_subscriptions as subs, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as blueprints from '@aws-quickstart/eks-blueprints';

export interface GuardDutyNotifierProps {
    // An environment name included in the notification email for identification purposes
    environmentName: string;
    // The email address to send security findings to
    email: string;
}
const defaultProps: GuardDutyNotifierProps = {
    environmentName: "main",
    email: 'your-email',
};

export default class GuardDutyNotifier extends Stack {
    constructor(scope: Construct, id: string, _props?: StackProps){
        super(scope, id);

        const stackID = `${id}-blueprint`
        const blueprint = blueprints.EksBlueprint.builder()
        .account(process.env.CDK_ACCOUNT_ID!)
        .region(process.env.CDK_DEFAULT_REGION!)
        .addOns()
        .teams().build(scope, stackID);

        // Enable GuardDuty in the AWS region, to detect security issues and include optional properties to configure. 
        new guardduty.CfnDetector(blueprint.getClusterInfo().cluster.stack, id+'GuardDutyDetector', { enable: true });
    
        // Configure GuardDuty to email any security findings
        const guardDutyTopic = new sns.Topic(blueprint.getClusterInfo().cluster.stack, id+'GuardDutyNotificationTopic');
        guardDutyTopic.addSubscription(new subs.EmailSubscription(defaultProps.email));
        const eventRule = new events.Rule(blueprint.getClusterInfo().cluster.stack, id+'GuardDutyEventRule', {
            eventPattern: {
                source: ['aws.guardduty'],
                detailType: ['GuardDuty Finding'],
            },
        });
        // Format the GuardDuty findings emails
        eventRule.addTarget(
            new eventTargets.SnsTopic(guardDutyTopic, {
                message: events.RuleTargetInput.fromText(
                    `WARNING: AWS GuardDuty has discovered a ${events.EventField.fromPath(
                        '$.detail.type',
                    )} security issue for ${defaultProps.environmentName} (${events.EventField.fromPath(
                        '$.region',
                    )}). Please go to https://${events.EventField.fromPath(
                        '$.region',
                    )}.console.aws.amazon.com/guardduty/ to find out more details.`,
                ),
            }),
        );
    }
}