import { Handler, Context, Callback } from 'aws-lambda';
import config from './config';
import AWS = require('aws-sdk');
import jenkins = require('jenkins');

const handler: Handler = async (event: any, context: Context, callback: Callback) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  AWS.config.update({ region: event.region });

  // if we are running locally, we need to assumeRole
  if (config.localRun as boolean) {
    try {
      var sts = new AWS.STS();
      const assumeRole = await sts.assumeRole({
        RoleArn: 'arn:aws:iam::755621335444:role/DATDevOps',
        RoleSessionName: 'lambdaRun'}).promise();

      console.log(assumeRole);
      AWS.config.update({
        accessKeyId: assumeRole.Credentials.AccessKeyId,
        secretAccessKey: assumeRole.Credentials.SecretAccessKey,
        sessionToken: assumeRole.Credentials.SessionToken
      });
    } catch (err) {
      console.log(err, err.stack);
      throw err;
    }
  }

  // query autoScalingGroup that triggered event
  const asgParams = {
    AutoScalingGroupNames: [
      event.detail.AutoScalingGroupName
    ]
  };

  let asgData;
  let jenkinsPipeline;
  try {
    var autoscaling = new AWS.AutoScaling();
    asgData = await autoscaling.describeAutoScalingGroups(asgParams).promise();

    // search for tag jenkinsPipeline
    let found = false;
    asgData.AutoScalingGroups[0].Tags.forEach(function(value) {
      if (value.Key == 'jenkinsPipeline') {
        found = true;
        jenkinsPipeline = value.Value;
      }
    });
    if (!found) {
      const err = new Error('Tag playbook not found');
      throw err;
    }

  } catch (err) {
    console.log(err, err.stack);
    throw err;
  }

  // query details of scaled-in EC2 instance
  const ec2Params = {
    InstanceIds: [
      event.detail.EC2InstanceId
    ]
  };

  let ec2Data;
  try {
    var ec2 = new AWS.EC2();
    ec2Data = await ec2.describeInstances(ec2Params).promise();
  } catch (err) {
    console.log(err, err.stack);
    throw err;
  }

  // now make our call to trigger jenkins
  var url = `http://${config.jenkinsUser}:${config.jenkinsPass}@${config.jenkinsUrl}`
  var connection = jenkins({ baseUrl: url, crumbIssuer: false, promisify: true });
  console.log(jenkinsPipeline);

  try {
    await connection.job.build({ name: jenkinsPipeline, parameters: { 'instanceIP': ec2Data.Reservations[0].Instances[0].PrivateIpAddress, 'accountId': event.account, 'region': event.region } });
    console.log('Sucessfully executed jenkins job');
  } catch (err) {
    console.log(err, err.stack);
    throw err;
  }

};

export { handler };
