#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DemolambdaStack } from '../lib/box-lambda-stack';

const app = new cdk.App();
const emailAddress: string = app.node.tryGetContext('emailAddress');
const defaultRegion: string = app.node.tryGetContext('defaultRegion');
new DemolambdaStack(app, 'DemolambdaStack', { emailAddress, defaultRegion });
