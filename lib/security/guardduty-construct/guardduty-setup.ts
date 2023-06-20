import * as aws_guardduty from "aws-cdk-lib/aws-guardduty";
import { Construct } from "constructs";
import { Stack, StackProps } from "aws-cdk-lib";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subs from "aws-cdk-lib/aws-sns-subscriptions";
import * as events from "aws-cdk-lib/aws-events";
import * as eventTargets from "aws-cdk-lib/aws-events-targets";

const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION;

export class GuardDutySetupStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, { ...props, env: { account, region } });

        const environmentName = "main";
        const email = "your-email@example.com";
        const features: aws_guardduty.CfnDetector.FeatureConfigurationsProperty[] =
      [
          { name: "S3_DATA_EVENTS", status: "ENABLED" },
          { name: "EKS_AUDIT_LOGS", status: "ENABLED" },
          { name: "EBS_MALWARE_PROTECTION", status: "ENABLED" },
          { name: "RDS_LOGIN_EVENTS", status: "ENABLED" },
          {
              name: "EKS_RUNTIME_MONITORING",
              status: "ENABLED",
              additionalConfiguration: [
                  {
                      name: "EKS_ADDON_MANAGEMENT",
                      status: "ENABLED",
                  },
              ],
          },
      ];

        // Create a GuardDuty detector
        new aws_guardduty.CfnDetector(this, id + "GuardDutyDetector", {
            enable: true,
            features,
        });

        // Configure GuardDuty to email any security findings
        const guardDutyTopic = new sns.Topic(
            this,
            id + "GuardDutyNotificationTopic"
        );
        guardDutyTopic.addSubscription(new subs.EmailSubscription(email));
        const eventRule = new events.Rule(this, id + "GuardDutyEventRule", {
            eventPattern: {
                source: ["aws.guardduty"],
                detailType: ["GuardDuty Finding"],
            },
        });
        // Format the GuardDuty findings emails
        eventRule.addTarget(
            new eventTargets.SnsTopic(guardDutyTopic, {
                message: events.RuleTargetInput.fromText(
                    `WARNING: AWS GuardDuty has discovered a ${events.EventField.fromPath(
                        "$.detail.type"
                    )} security issue for ${environmentName} (${events.EventField.fromPath(
                        "$.region"
                    )}). Please go to https://${events.EventField.fromPath(
                        "$.region"
                    )}.console.aws.amazon.com/guardduty/ to find out more details.`
                ),
            })
        );
    }
}
