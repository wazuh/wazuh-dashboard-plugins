/*
 * Wazuh app - AWS sample data
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

 // Amazon AWS services
export const source = ["guardduty", "cloudtrail", "vpcflow", "config"];
export const accountId = ["186157501624", "117521235382", "150447125201", "18773455640", "186154171780", "250141701015"];
export const region = ["eu-west-1", "eu-west-2", "eu-west-3", "eu-north-1", "eu-central-1", "us-east-1", "us-east-2", "us-west-1", "us-west-2", "me-south-1", "ap-east-1", "ap-east-2", "ap-northeast-2", "ap-northeast-3", "ap-south-1", "ap-southeast-1", "ap-southeast-2", "ap-northeast-1", "ca-central-1"]; // https://docs.aws.amazon.com/es_es/AWSEC2/latest/UserGuide/using-regions-availability-zones.html#concepts-regions
export const buckets = ["aws-sample-bucket-1", "aws-sample-bucket-2", "aws-sample-bucket-3", "aws-sample-bucket-4", "aws-sample-bucket-5", "aws-sample-bucket-6", "aws-sample-bucket-7", "aws-sample-bucket-8", "aws-sample-bucket-9"];

export const instanceId = ['i-060bb01699dddc20c','i-060bb020479bedc20w', 'i-070eb020479bebf20a', 'i-070eb015479befb15d', 'i-057eb060779fdae15b'];

export const remoteIpDetails = [
  {
    country: {
      countryName: "Mexico"
    },
    city: {
      cityName: "Mérida"
    },
    geoLocation: {
      lon: "-89.616700",
      lat: "20.950000"
    },
    organization: {
      asnOrg: "Internet Mexico Company",
      org: "Internet Mexico Company",
      isp: "Internet Mexico Company",
      asn: "4257"
    },
    ipAddressV4: "160.0.14.40"
  },
  {
    country: {
      countryName: "Italy"
    },
    city: {
      cityName: "Savona"
    },
    geoLocation: {
      lon: "8.477200",
      lat: "44.309000"
    },
    organization: {
      asnOrg: "Speedweb",
      org: "Speedweb",
      isp: "Speedweb",
      asn: "42784"
    },
    ipAddressV4: "2.25.80.45"
  },
  {
    country: {
      countryName: "Mexico"
    },
    city: {
      cityName: "Colima"
    },
    geoLocation: {
      lon: "-103.714500",
      lat: "19.266800"
    },
    organization: {
      asnOrg: "Internet Mexico Company",
      org: "Internet Mexico Company",
      isp: "Internet Mexico Company",
      asn: "4257"
    },
    ipAddressV4: "187.234.16.206"
  },
  {
    country: {
      countryName: "Netherlands"
    },
    city: {
      cityName: "Amsterdam"
    },
    geoLocation: {
      lon: "4.889700",
      lat: "52.374000"
    },
    organization: {
      asnOrg: "Netherlands Telecom",
      org: "Netherlands Telecom",
      isp: "Netherlands Telecom",
      asn: "40070"
    },
    ipAddressV4: "160.0.14.40"
  },
  {
    country: {
      "countryName": "Italy"
    },
    city: {
      cityName: "Palermo"
    },
    geoLocation: {
      lon: "13.334100",
      lat: "38.129000"
    },
    organization: {
      asnOrg: "Net Connections",
      org: "Net Connections",
      isp: "Net Connections",
      asn: "1547"
    },
    ipAddressV4: "75.0.101.245"
  },
  {
    country: {
      countryName: "United States"
    },
    city: {
      cityName: "Panama City"
    },
    geoLocation: {
      lon: "-85.669600",
      lat: "30.190900"
    },
    organization: {
      asnOrg: "Internet Innovations",
      org: "Intenet Innovations",
      isp: "Intenet Innovations",
      asn: "4252"
    },
    ipAddressV4: "70.24.101.214"
  }
];

export const instanceDetails = [
  {
    "launchTime": "2020-04-22T11:17:08Z",
    "instanceId": "i-0b0b8b34a48c8f1c4",
    "networkInterfaces": {
      "networkInterfaceId": "eni-01e777fb9acd548e4",
      "subnetId": "subnet-7930da22",
      "vpcId": "vpc-68e3c60f",
      "privateDnsName": "ip-10-0-2-2.ec2.internal",
      "publicIp": "40.220.125.204",
      "publicDnsName": "ec2-40.220.125.204.compute-1.amazonaws.com",
      "privateIpAddress": "10.0.2.2"
    },
    "instanceState": "running",
    "imageId": "ami-0ff8a91507f77f900",
    "instanceType": "t2.small",
    "imageDescription": "Amazon Linux AMI 2018.03.0.20180811 x86_64 HVM GP2",
    "iamInstanceProfile": {
      "id": "AIPAJGAZMFPZHKIBOCBIG",
      "arn": "arn:aws:iam::{data.aws.accountId}:instance-profile/opsworks-web-production"
    },
    "availabilityZone": "us-east-1a"
  },
  {
    "launchTime": "2019-03-22T14:15:41Z",
    "instanceId": "i-0cab4a083d57dc400",
    "networkInterfaces": {
      "networkInterfaceId": "eni-0bb465b2d939dbda6",
      "subnetId": "subnet-6b1d6203",
      "vpcId": "vpc-921e61fa",
      "privateDnsName": "ip-10-0-0-1.ec2.internal",
      "publicIp": "54.90.48.38",
      "publicDnsName": "ec2-54.90.48.38.compute-1.amazonaws.com",
      "privateIpAddress": "10.0.0.1"
    },
    "instanceState": "running",
    "imageId": "ami-09ae67bbfcd740875",
    "instanceType": "a1.medium",
    "imageDescription": "Canonical, Ubuntu, 18.04 LTS, UNSUPPORTED daily arm64 bionic image build on 2019-02-12",
    "productCodes": {
      "productCodeId": "zud1u4kjmxu2j2jf0n36bqa",
      "productCodeType": "marketplace"
    },
    "iamInstanceProfile": { // FIXME
      "id": "AIPAJGAZMFPZHKIBOUFGA",
      "arn": "arn:aws:iam::{data.aws.accountId}:instance-profile/opsworks-web-production"
    },
    "availabilityZone": "us-east-1e"
  }
]

export const guarddutyPortProbe = {
  data: {
    aws: {
      severity: "2",
      schemaVersion: "2.0",
      resource: {
        // instanceDetails
        resourceType: "Instance"
      },
      description: "EC2 instance has an unprotected port which is being probed by a known malicious host.",
      source: "guardduty",
      type: "Recon:EC2/PortProbeUnprotectedPort",
      title: "Unprotected port on EC2 instance {data.aws.resource.instanceDetails.instanceId} is being probed.",
      // accountId: "166157441623",
      // createdAt: "2019-07-31T16:31:14.739Z",
      partition: "aws",
      service: {
        archived: "false",
        resourceRole: "TARGET",
        detectorId: "cab38390b400c06fb2897dfcebffb80d",
        // eventFirstSeen: "2019-07-31T16:18:08Z",
        // eventLastSeen: "2020-04-22T04:11:01Z",
        additionalInfo: {
          threatListName: "ProofPoint",
          threatName: "Scanner"
        },
        count: "2594",
        action: {
          actionType: "PORT_PROBE",
          portProbeAction: {
            blocked: "false",
            portProbeDetails: {
              localPortDetails: {
                port: "80",
                portName: "HTTP"
              },
              remoteIpDetails: {
                country: {
                  countryName: "Mexico"
                },
                city: {
                  cityName: "M?rida"
                },
                geoLocation: {
                  lon: "-89.616700",
                  lat: "20.950000"
                },
                organization: {
                  asnOrg: "Internet Mexico Company",
                  org: "Internet Mexico Company",
                  isp: "Internet Mexico Company",
                  asn: "4257"
                },
                ipAddressV4: "187.234.16.206"
              }
            }
          }
        },
        "serviceName": "guardduty"
      }
    }
  },
  rule: {
    firedtimes: 1,
    mail: false,
    level: 3,
    description: "AWS GuardDuty: PORT_PROBE - Unprotected port on EC2 instance {data.aws.resource.instanceDetails.instanceId} is being probed. [IP: {data.aws.service.action.portProbeAction.portProbeDetails.remoteIpDetails.ipAddressV4}] [Port: {data.aws.service.action.portProbeAction.portProbeDetails.localPortDetails.port}]",
    groups: ["amazon","aws","aws_guardduty"],
    id: "80305"
  },
  location: "Wazuh-AWS",
  decoder: {
    "name": "json"
  },
};

export const apiCall = {
  "data": {
    "aws": {
      "severity": "5",
      "schemaVersion": "2.0",
      "resource": {
        "accessKeyDetails": {
          "principalId": "AIDAIL4SI43KE7QMMBABB",
          "userType": "IAMUser",
          "userName": ""
        },
        "resourceType": "AccessKey"
      },
      "log_info": {
        "s3bucket": "wazuh-aws-wodle",
        "log_file": "guardduty/2020/04/22/10/firehose_guardduty-1-2020-04-22-10-36-02-d67c99dc-800a-486a-8339-59a7a8254ab2.zip"
      },
      "description": "Unusual console login seen from principal {data.aws.resource.accessKeyDetails.userName}. Login activity using this client application, from the specific location has not been seen before from this principal.",
      "source": "guardduty",
      "type": "UnauthorizedAccess:IAMUser/ConsoleLogin",
      "title": "Unusual console login was seen for principal {data.aws.resource.accessKeyDetails.userName}.",
      "accountId": "166157447443",
      "createdAt": "2020-04-22T10:30:26.721Z",
      "partition": "aws",
      "service": {
        "archived": "false",
        "resourceRole": "TARGET",
        "detectorId": "cab38390b728c06fb2897dfcebffb80d",
        "eventFirstSeen": "2020-04-22T10:09:51Z",
        "eventLastSeen": "2020-04-22T10:09:55Z",
        "additionalInfo": {
          "recentApiCalls": {
            "count": "1",
            "api": "ConsoleLogin"
          }
        },
        "count": "1",
        "action": {
          "actionType": "AWS_API_CALL",
          "awsApiCallAction": {
            "callerType": "Remote IP",
            "api": "ConsoleLogin",
            "serviceName": "signin.amazonaws.com",
            "remoteIpDetails": {
              "country": {
                "countryName": "United States"
              },
              "city": {
                "cityName": "Ashburn"
              },
              "geoLocation": {
                "lon": "-77.472800",
                "lat": "39.048100"
              },
              "organization": {
                "asnOrg": "ASN-Internet-Com",
                "org": "Internet-Com",
                "isp": "Internet-Com",
                "asn": "27850"
              },
              "ipAddressV4": "80.14.0.90"
            }
          }
        },
        "serviceName": "guardduty"
      },
      "id": "a8b8d0b82c50eed686df4d24fa87b657",
      "region": "us-east-1",
      "arn": "arn:aws:guardduty:us-east-1:166157441478:detector/cab38390b728c06fb2897dfcebffc80d/finding/a8b8d0b82c50eed686df4d24fa87b657",
      "updatedAt": "2020-04-22T10:30:26.721Z"
    }
  },
  "rule": {
    // "firedtimes": 1,
    "mail": false,
    "level": 6,
    "description": "AWS GuardDuty: AWS_API_CALL - Unusual console login was seen for principal {data.aws.resource.accessKeyDetails.userName}.",
    "groups": [
      "amazon",
      "aws",
      "aws_guardduty"
    ],
    "id": "80302"
  },
  "location": "Wazuh-AWS",
  "decoder": {
    "name": "json"
  }
};

export const networkConnection = {
  "data": {
    "integration": "aws",
    "aws": {
      "severity": "5",
      "schemaVersion": "2.0",
      "resource": {
        "resourceType": "Instance"
      },
      "description": "EC2 instance {data.aws.resource.instanceDetails.instanceId} is communicating with a remote host on an unusual server port 5060.",
      "source": "guardduty",
      "type": "Behavior:EC2/NetworkPortUnusual",
      "title": "Unusual outbound communication seen from EC2 instance {data.aws.resource.instanceDetails.instanceId} on server port 5060.",
      "accountId": "166157441800",
      "createdAt": "2020-04-22T07:18:12.769Z",
      "partition": "aws",
      "service": {
        "archived": "false",
        "resourceRole": "ACTOR",
        "detectorId": "cab38390b728c06fb2897dfcebffc80d",
        "eventFirstSeen": "2020-04-22T07:13:44Z",
        "eventLastSeen": "2020-04-22T07:15:04Z",
        "additionalInfo": {
          "localPort": "50040",
          "outBytes": "1912",
          "inBytes": "4621",
          "unusual": "5060"
        },
        "count": "8",
        "action": {
          "actionType": "NETWORK_CONNECTION",
          "networkConnectionAction": {
            "localIpDetails": {
              "ipAddressV4": "10.0.0.251"
            },
            "protocol": "TCP",
            "blocked": "false",
            "connectionDirection": "OUTBOUND",
            "localPortDetails": {
              "port": "36220",
              "portName": "Unknown"
            },
            "remotePortDetails": {
              "port": "5050",
              "portName": "Unknown"
            },
            "remoteIpDetails": {
              "country": {
                "countryName": "United States"
              },
              "city": {
                "cityName": "Washington"
              },
              "geoLocation": {
                "lon": "-77.031900",
                "lat": "38.905700"
              },
              "organization": {
                "asnOrg": "ASN-Supreme-Web",
                "org": "Supreme Web",
                "isp": "Supreme Web",
                "asn": "395604"
              },
              "ipAddressV4": "8.2.14.2"
            }
          }
        },
        "serviceName": "guardduty"
      },
      "id": "06b8d0602d109db1282f9143809f80b8",
      "region": "us-east-1",
      "arn": "arn:aws:guardduty:{data.aws.region}:166157441758:detector/cab38390b728c06fb2897dfcebffb79d/finding/06b8d0602d109db1282f9143809f80b8",
      "updatedAt": "2020-04-22T07:18:12.778Z"
    }
  },
  "rule": {
    "mail": false,
    "level": 6,
    "description": "AWS GuardDuty: NETWORK_CONNECTION - Unusual outbound communication seen from EC2 instance {data.aws.resource.instanceDetails.instanceId} on server port 5060.",
    "groups": [
      "amazon",
      "aws",
      "aws_guardduty"
    ],
    "id": "80302"
  },
  "location": "Wazuh-AWS",
  "decoder": {
    "name": "json"
  },
};

export const iamPolicyGrantGlobal = {
  "data": {
    "aws": {
      "severity": "CRITICAL",
      "actor": "resources.wazuh.sample.com",
      "summary": {
        "Timestamps": "2020-04-22T00:11:44.617597Z,",
        "Description": "S3 Bucket uses IAM policy to grant read rights to Everyone. Your IAM policy contains a clause that effectively grants read access to any user. Please audit this bucket, and data contained within and confirm that this is intentional. If intentional, please use the alert whitelist feature to prevent future alerts",
        "Bucket": "resources.wazuh.sample.com,",
        "Record Count": "1",
        "Event Count": "1",
        "recipientAccountId": "166157441400",
        "ACL": {
          "resources": {
            "wazuh": {
              "com": {
                "Owner": {
                  "DisplayName": "wazuh",
                  "ID": "3ab1235e25ea9e94ff9b7e4e379ba6b0c872cd36c096e1ac8cce7df433b48700"
                }
              }
            }
          }
        }
      },
      "risk-score": "9",
      "notification-type": "ALERT_CREATED",
      "name": "S3 Bucket IAM policy grants global read rights",
      "created-at": "2020-04-22T00:14:45.764008",
      "source": "macie",
      "url": "https://mt.{data.aws.region}.macie.aws.amazon.com/posts/arn%3Aaws%3Amacie%3A{data.aws.region}%3A166158075623%3Atrigger%2Fb731d9ffb1fe61508d4b490c92efa666%2Falert%2Fd78f0fd0a55ad458799e4c1fb6a0eded",
      "tags": {
        "value": "Open Permissions,Basic Alert,"
      },
      "alert-arn": "arn:aws:macie:{data.aws.region}:166157441400:trigger/b731d9ffb1fe61508d4a478c92efa666/alert/d78f0fd0a55ad458799e4c1fb6a0ed"
    }
  },
  "rule": {
    "mail": true,
    "level": 12,
    "description": "AWS Macie CRITICAL: S3 Bucket IAM policy grants global read rights - S3 Bucket uses IAM policy to grant read rights to Everyone. Your IAM policy contains a clause that effectively grants read access to any user. Please audit this bucket, and data contained within and confirm that this is intentional. If intentional, please use the alert whitelist feature to prevent future alerts",
    "groups": ["amazon","aws","aws_macie"],
    "id": "80355"
  },
  "location": "Wazuh-AWS",
  "decoder": {
    "name": "json"
  }
};
