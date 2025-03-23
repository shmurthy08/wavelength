#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { WavelengthStack } from '../lib/wavelength-stack';

const app = new cdk.App();

new WavelengthStack(app, 'WavelengthStack', {
  env: {
    account: '207567761455',
    region: 'us-west-1'
  }
});