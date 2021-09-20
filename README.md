## AWS protected by password website served by Amazon CloudFront using Lambda@Edge.

How to create a simple website on AWS, configuring the password protected pages.

Inside the src/ folder you'll find :
- *index.js* => A node Auth file, to handle the website passwords.
- *s3_policy.json* => The AWS policy to use with the aws cli.
- *trust_policy.json* => The Lambda@Edge policy to use with the aws cli.

**Requirements**:

- S3 (for our static files)
- CloudFront to serve the website.
- Lamba@Edge to run the node.js

**Extra:**
- Route 53 (for our domain DNS).
- CloudFront (CDN — will serve our static files from various locations).
- Certificate Manager (SSL certificate.
- Secret Manager.
- Keycloack/Okta to retrieve user/password.


### 1. Create and configure the S3 bucket
You need to log-in into the AWS management console and look for the S3 service.
Once found, we have to create a S3 bucket with our domain name.
In this case, the bucket name is: **garanet**
You have to make sure that bucket name is exactly the same as your domain name.

##### Create the S3 Bucket
```bash
s3cmd mb s3://garanet
```

##### Upload files to S3 Bucket
```bash
s3cmd put index.html s3://garanet/
```

##### Configuration and Bucket settings
- From the *AWS management console* -> *S3* - Hit the *Properties* tab, and you should be able to see Static website hosting option.
- Open it, select *“Use this bucket to host a website”* and then you need to type the index document of your website i.e. index.html in our case.
- In order to make it public, we will add a Bucket Policy, but before adding it, we need to enable our bucket to accept new bucket policies.
- Go to the *Permissions* tab of your bucket and then open the *Public access settings* tab.

By default, you should see all settings set to true.

You are only interested in the “public bucket policies”

Hit the edit button, and then untick the following settings as shown below.
  * Block all public access
  * Off
  * Block public access to buckets and objects granted through new access control lists (ACLs)
  * On
  * Block public access to buckets and objects granted through any access control lists (ACLs)
  * On
  * Block public access to buckets and objects granted through new public bucket or access point policies
  * Off
  * Block public and cross-account access to buckets and objects through any public bucket or access point policies
  * Off

Click the *save* button.

This allows you to add new Bucket Policies for our S3 bucket.
The only bucket policy we need is to make our bucket available to the world.

Go to the *Permissions* tab of the bucket again and then open the *Bucket Policy* tab.
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AddPerm",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::garanet/*"
        }
    ]
}
```
or run:
```bash
s3cmd setpolicy source/s3_policy.json s3://garanet
```

It would allow any visitor “read access” of any object in your buckets. This means that anyone would be able to access your website content. 

In order to test our implementation so far, go back to the *Properties* tab and then to the Static website hosting option.

You should be able to find the “*endpoint*” of your bucket. Try accessing it and you should be able to see your website

* More info and configuration, like SSL and www redirects check the reference: https://faun.pub/how-to-host-your-static-website-with-s3-cloudfront-and-set-up-an-ssl-certificate-9ee48cd701f9

### 2. Creation of the Lambda@Edge custom function
Before we continue, we need to understand that Lambda@Edge is not entirely the same thing as AWS Lambda.

Lambda@Edge functions are more limited compared to the standard Lambda functions, you can learn more about these limits and quotas in the AWS online documentation.

**Deployment of the function**

Navigate to the https://console.aws.amazon.com/lambda/home?region=REGION#/functions and click on the *"Create function"*

Fill 
- Function name: "basicAuth", 
- Runtime choose: "Node.js 12.x" 
- Click on the *"Create function"*

Replace the default Lambda code with the source code and click on the *"Deploy"*

Scroll to the top and from the *"Actions"* pulldown menu select: *"Publish new version"*, do not enter anything into the input field, just click on the *"Publish"*

From the top-right corner of the screen locate ARN string and copy this entire ARN string into the clipboard. **ARN should look like this: arn:aws:lambda:REGION-0:XXXXXXXXXXXX:function:basicAuth:1**

**Configuration of the Trust relationship**

- Navigate to the https://console.aws.amazon.com/iam/home?region=REGION#/roles
- Enter into the search the name of your Lambda function, e.g. basicAuth, once it is displayed in the list, click on it
- Click on the tab called: "*Trust relationships"*, click on the *"Edit trust relationship"* and replace the existing code with the following code:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": [
          "lambda.amazonaws.com",
          "edgelambda.amazonaws.com"
        ]
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```
Click on the *"Update Trust policy"*

or
```bash
aws iam create-role --role-name garanet --assume-role-policy-document source/trust_policy.json
```

### 3. Configuration of the CloudFront/Cache Behavior settings

- Navigate to the https://console.aws.amazon.com/cloudfront/home and click on the Amazon CloudFront distribution which you would like to password protect (click on the respective blue hyperlinked distribution ID in the table)

- Click on the "Behaviors", check the checkbox for the URL Path Pattern that you want to protect (e.g. Default (*) to password protect your entire website), after you checked the checkbox, click on the "Edit" located above.

- Scroll down to the section called "Lambda Function Associations", from the pulldown menu called "Select Event Type" choose "Viewer Request", as Lambda Function ARN paste from the clipboard your Lambda function's ARN containing also the Lambda function version number.

- Click on the "Yes, Edit" button and wait approx. 5 to 7 minutes for CloudFront distribution to reload

* Open the URL of your AWS website in your web browser*
Upon your arrival to your AWS website via the web browser, you should be prompted to enter username and password.

* More info and configuration, like the Cache Behavior settings check the reference: https://www.linkedin.com/pulse/how-password-protect-your-aws-website-served-amazon-using-skultety

* Examples of Keycloack-lambda-auth.** https://www.npmjs.com/package/keycloak-lambda-authorizer
