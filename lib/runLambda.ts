import { handler } from './index';

const event = {
  "region": "us-west-2",
  "account": "755621335444",
  "detail": {
    "EC2InstanceId": "i-0bb25816a44d884ba",
    "AutoScalingGroupName": "k8s-dev-120180724183639841600000002"
  }
}

try {
  handler(event, null, null);
  console.log('Lambda finished');
} catch (err) {
  throw err;
}
