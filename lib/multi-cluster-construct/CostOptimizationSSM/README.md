# SSM Cost Optimizations for conformitron clusters

Running 9 testing clusters for 24 hours results in a daily spend of $300+

To minimize these costs we have written a systems manager automation which automatically scales down autoscaling group to 0 desired nodes during off-business hours.

On weekdays 5 PM PST clusters are scaled to 0 -> CRON EXPRESSION:  0 17 ? * MON-FRI *
On weekdays 5 AM PST clusters are scaled to 1 -> CRON EXPRESSION:  0 05 ? * MON-FRI *
On weekends clusters stay scaled to 0.

These optimizations bring down the weekly cost to less than 1000$ essentially for >60% cost savings.


Please find the SSM Automation documents `./ScaleDownEKStoZero.YAML` and `./ScaleUpEKStoOne.YAML`in this directory. They are triggered by event bridge on the con schedule specified above.