# tg-slack-channel-manager
This repository consists of a Slackbot that forward all message from the Slacks channels (with prefixes `ext-` and `ext-partner`) to centralised Slack channels. 

Our example consist of:
* Forward all external user messages from channels starts with `ext-partner-*` to `ext-partner-all`
* Forward all external user messages from channels starts with `ext-*` (but not `ext-partner-*`) to `ext-all`
* Automatically detect/create `ext-all` and `ext-partner-all` channels on bot start up
* Automatically monitoring any newly created `ext-*` and `ext-partner-*` channels

## Prerequisites
1. Slack Workspace (with admin access to deploy)
2. Ability to deploy a Slackbot (instructions below)

## Install Steps
### Create and setup Slack App
1. Create New Slack app from a manifest [here](https://api.slack.com/apps)
2. Paste the content from [manifest.yaml](./manifest.yml)
3. Install the Slack app to your Workspace
4. Retrieve the _signing secret_ from the `Basic Information` page and _bot token_ from `OAuth & Permissions` page

### Configuration
Please prepare the following configuration parameters (refer to the [example file](./tg-slack-channelmanager.conf)):
- `SLACK_SECRET` Slack signing secret
- `SLACK_BOT_TOKEN` Slack bot token (begins with `xoxb-`)


### Deploy on Google CloudRun (CloudRun Button)
1. Ensure you have the following pre-requisites:
   - All configuration parameters from the `Configuration` section above
   - `PROJECT_ID` GCP Project (will be passed to container for it to access secrets)
   - Google Cloud project owner
2. Click and follow the steps in GCP CloudShell, entering the configuration parameters when prompted:

[![Run on Google Cloud](https://deploy.cloud.run/button.svg)](https://deploy.cloud.run?git_repo=https://github.com/Twingate-Labs/tg-slack-channel-manager)

The `Run on Google Cloud option` will prompt for all pre-requisite parameters during setup and store them as secrets. For a full description of the executed steps please see [`app.json`](./app.json).

For a manual deployment you may instead follow the [manual instructions](./docs/MANUAL_DEPLOYMENT.md)

### Complete setup in Slack App UI
1. Go to your app at [Slack App UI](https://api.slack.com/apps)
3. Event Subscription
   * Replace the Request URL to `https://{Your tg-slack-channel-manager URL}/slack/events`
