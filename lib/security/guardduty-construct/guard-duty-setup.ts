import * as aws_guardduty from "aws-cdk-lib/aws-guardduty";
import { Construct } from "constructs";
import * as cr from "aws-cdk-lib/custom-resources";
import * as iam from "aws-cdk-lib/aws-iam";
import * as blueprints from "@aws-quickstart/eks-blueprints";
import { NestedStack, NestedStackProps } from "aws-cdk-lib";
import { CfnOutput } from "aws-cdk-lib";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subs from "aws-cdk-lib/aws-sns-subscriptions";
import * as events from "aws-cdk-lib/aws-events";
import * as eventTargets from "aws-cdk-lib/aws-events-targets";

export class GuardDutySetupStack extends NestedStack {
  public static builder(
    environmentName: string,
    email: string,
    features?: aws_guardduty.CfnDetector.FeatureConfigurationsProperty[]
  ): blueprints.NestedStackBuilder {
    return {
      build(scope: Construct, id: string, props: NestedStackProps) {
        return new GuardDutySetupStack(
          scope,
          id,
          props,
          environmentName,
          email,
          features
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
    features?: aws_guardduty.CfnDetector.FeatureConfigurationsProperty[]
  ) {
    super(scope, id, props);

    const isGuardDutyEnabled = new cr.AwsCustomResource(
      this,
      "IsGuardDutyEnabled",
      {
        onUpdate: {
          service: "GuardDuty",
          action: "listDetectors",
          parameters: {},
          physicalResourceId: cr.PhysicalResourceId.of("IsGuardDutyEnabled"),
        },
        policy: cr.AwsCustomResourcePolicy.fromStatements([
          new iam.PolicyStatement({
            actions: ["guardduty:ListDetectors"],
            resources: ["*"],
          }),
        ]),
      }
    );

    if (isGuardDutyEnabled.getResponseField("DetectorIds").length > 0) {
      new CfnOutput(this, "GuardDutyDetectorExists", {
        value:
          "GuardDuty is already enabled in this region. Skipping (assuming it's managed in some other way)...",
      });
    } else {
      new aws_guardduty.CfnDetector(this, id + "GuardDutyDetector", {
        enable: true,
        features,
      });
    }

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
