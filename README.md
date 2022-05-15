# Demo Box Upload Blog

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Required Packages

- Node v14.x
- Npm v6.x
- CDK CLI v2.x

## How to test

1. Install required packages
2. Enter the appropriate *emailAddress* and *defaultRegion* in cdk.json
3. Store Box config and Box folder id in SSM parameter
4. CDK Deploy

### 1 Install required packages

```
npm i
```
### 2 Enter the appropriate *emailAddress* and *defaultRegion* in cdk.json

No special explanation required.

### 3 Store Box config and Box folder id in SSM parameter

Paste the Box config into the AWS SSM console.

### 4 CDK Deploy

```
cdk deploy
```

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template

