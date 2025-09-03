import { Stack, StackProps, Tags, Duration, aws_lambda as lambda } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';

export class SampleAppCdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const prefix = this.node.tryGetContext('resourcePrefix') ?? 'pd-';
    const owner = this.node.tryGetContext('ownerTag') ?? 'PlerionDemo';

    Tags.of(this).add('Owner', owner);

    const commonFnProps = {
      runtime: lambda.Runtime.NODEJS_22_X,
      memorySize: 128,
      timeout: Duration.seconds(10),
      bundling: {
        minify: false,
        externalModules: ['aws-sdk', 'axios', 'lodash'] as string[],
        sourcesContent: false,
        bundle: false,
        commandHooks: {
          beforeBundling(_inputDir: string, _outputDir: string): string[] {
            return [];
          },
          beforeInstall(_inputDir: string, _outputDir: string): string[] {
            return [];
          },
          afterBundling(inputDir: string, outputDir: string): string[] {
            // Copy package files and install only production dependencies
            return [
              `bash -lc "if [ -f ${inputDir}/package.json ]; then cp ${inputDir}/package.json ${outputDir}/package.json; fi"`,
              `bash -lc "if [ -f ${inputDir}/package-lock.json ]; then cp ${inputDir}/package-lock.json ${outputDir}/package-lock.json; fi"`,
              `bash -lc "cd ${outputDir} && npm ci --only=production --no-audit --no-fund --ignore-scripts"`
            ];
          }
        }
      }
    } as const;

    new NodejsFunction(this, 'LambdaA', {
      ...commonFnProps,
      functionName: `${prefix}lambda-a`,
      entry: path.join(__dirname, '..', 'src', 'lambda-a', 'index.ts'),
      handler: 'handler'
    });

    new NodejsFunction(this, 'LambdaB', {
      ...commonFnProps,
      functionName: `${prefix}lambda-b`,
      entry: path.join(__dirname, '..', 'src', 'lambda-b', 'index.ts'),
      handler: 'handler'
    });
  }
}


