import {
  aws_guardduty as guardduty,
  aws_events as events,
  aws_events_targets as eventTargets,
  aws_sns as sns,
  aws_sns_subscriptions as subs,
} from "aws-cdk-lib";
import { NestedStack, NestedStackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as blueprints from "@aws-quickstart/eks-blueprints";

export class GuardDutySetupStack extends NestedStack {
  public static builder(
    environmentName: string,
    email: string,
    dataSources?: guardduty.CfnDetector.CFNDataSourceConfigurationsProperty
  ): blueprints.NestedStackBuilder {
    return {
      build(scope: Construct, id: string, props: NestedStackProps) {
        return new GuardDutySetupStack(
          scope,
          id,
          props,
          environmentName,
          email,
          dataSources
        );
      },
    };
  }

  constructor(
    scope: Construct,
    id: string,
    props: NestedStackProps,
    environmentName: string,
    email: string,
    dataSources?: guardduty.CfnDetector.CFNDataSourceConfigurationsProperty
  ) {
    super(scope, id, props);

    // Enable GuardDuty in the AWS region, to detect security issues and include optional properties to configure.
    new guardduty.CfnDetector(this, id + "GuardDutyDetector", {
      enable: true,
      dataSources: dataSources,
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
