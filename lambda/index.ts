import BoxSDK from 'box-node-sdk';
import * as path from 'path';
import { Handler, S3Event } from 'aws-lambda';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { Readable } from 'stream';

const region = process.env.REGION!;

const s3 = new S3Client({
  region,
});

const ssmClient = new SSMClient({ region });

const minimumFileSize = 20000000;

type DemoHandler = Handler;

export const handler: DemoHandler = async function (event: S3Event) {
  type SsmInput = {
    Name: string;
    WithDecryption: boolean;
  };

  const ssmInput = (ssmParamName: string): SsmInput => {
    return {
      Name: ssmParamName,
      WithDecryption: true,
    };
  };

  const ssmBoxConfigRes = await ssmClient.send(
    new GetParameterCommand(ssmInput('BoxConfigParams'))
  );

  const boxConfig = ssmBoxConfigRes.Parameter?.Value;
  if (!boxConfig) {
    return;
  }

  const sdk = BoxSDK.getPreconfiguredInstance(JSON.parse(boxConfig));
  const client = sdk.getAppAuthClient('enterprise');

  const ssmBoxFolderRes = await ssmClient.send(
    new GetParameterCommand(ssmInput('BoxFolderID'))
  );

  const bucket = event.Records[0].s3.bucket.name;
  const key = decodeURIComponent(
    event.Records[0].s3.object.key.replace(/\+/g, ' ')
  );
  const bucketParams = {
    Bucket: bucket,
    Key: key,
  };

  const s3Object = await s3.send(new GetObjectCommand(bucketParams));

  if (!s3Object.ContentLength) {
    return;
  }

  const boxFolderId = ssmBoxFolderRes.Parameter?.Value;
  if (!boxFolderId) {
    return;
  }

  console.log(path.parse(key).base);

  const fileName = path.parse(key).base;

  // アップロードファイルが20MB以上の場合、アップロードAPIを切り替える
  if (s3Object.ContentLength <= minimumFileSize) {
    console.log('not multiParts func');
    await client.files
      .uploadFile(boxFolderId, fileName, s3Object.Body as Readable)
      .then((file: unknown) => console.log(file))
      .catch((err: unknown) => console.log('Got an error!', err));
  } else {
    console.log('multiParts func');
    await client.files
      .getChunkedUploader(
        boxFolderId,
        s3Object.ContentLength,
        fileName,
        s3Object.Body as Readable
      )
      .then((uploader: { start: () => void }) => uploader.start())
      .then((file: unknown) => console.log(file))
      .catch((err: unknown) => console.log('Got an error!', err));
  }
};
