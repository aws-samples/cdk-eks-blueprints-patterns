# Konveyor on EKS

## Deployment

Setup a Hosted Zone in Route 53, with your parent domain (the pattern will create a new subdomain with format _{konveyorLabel}.{parent domain}_).

Fill in _KonveyorConstructProps_ in file _bin/konveyor.ts_:
- account: your AWS account number
- region: the region of your choice
- parentDomain: the parent domain in your Hosted Zone
- konveyorLabel: to be used in _{konveyorLabel}.{parent domain}_
- hostedZoneId: the Hosted zone ID (format: 20x chars/numbers)
- certificateResourceName: resource name of the certificate, registered by the resource provider

Follow the deployment instructions detailed in the main README file of this repository, using _konveyor_ as the name of the pattern.