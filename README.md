# slack-bot-ext-merge
This project deploys a Slackbot to Google Cloud Run, which allows Twingate to centralise all the ext-* and ext-partner-* channels. 

## Prerequisite
1. Slack Workspace
2. Google Cloud Account

## Set Up Steps
### Slack App Initial Setup
1. Create New Slack app from a manifest [here](https://api.slack.com/apps)
2. Paste the content from [manifest.yaml](https://github.com/Twingate-Labs/slack-bot-ext-merge/blob/master/manifest.yml)
3. Install the Slack app to your Workspace
4. Retrieve the signing secret from Basic Info and bot token at OAuth & Permissions

### Deploy App to Cloud Run
1. Open Google Cloud Shell
2. Clone the project `git clone https://github.com/Twingate-Labs/slack-bot-ext-merge.git`
3. Setup Google Secrete Manager (replace `{YOUR_BOT_TOKEN}` and `{YOUR_SECRET}` with the corresponding values)
```
    export BOT_TOKEN={YOUR_BOT_TOKEN}
    export SIGNING_SECRET={YOUR_SECRET}
    gcloud services enable secretmanager.googleapis.com
    gcloud projects add-iam-policy-binding $GOOGLE_CLOUD_PROJECT --member=user:$(gcloud auth list --format 'value(account)') --role=roles/secretmanager.admin
    echo -n $BOT_TOKEN | gcloud secrets create tg-channel-merge-bot-token --replication-policy=automatic --data-file=-
    echo -n $SIGNING_SECRET | gcloud secrets create tg-channel-merge-client-signing-secret --replication-policy=automatic --data-file=-
```


4. Enter the following commands to build the Docker image
```
    gcloud config set compute/zone europe-west2-a
    cd slack-bot-ext-merge
    export PROJECT_ID=$(gcloud config list --format 'value(core.project)')
    gcloud services enable cloudbuild.googleapis.com
    gcloud builds submit --tag gcr.io/${PROJECT_ID}/tg-channel-merge .
```

5. Enter the following commands to deploy the app to Cloud Run
```
    gcloud services enable run.googleapis.com
    gcloud config set run/platform managed
    gcloud config set run/region europe-west2
    export SERVICE_ACCOUNT=$(gcloud iam service-accounts list --format 'value(EMAIL)' --filter 'NAME:Compute Engine default service account')
    gcloud projects add-iam-policy-binding $PROJECT_ID --member=serviceAccount:$SERVICE_ACCOUNT --role=roles/secretmanager.secretAccessor
    gcloud run deploy tg-channel-merge --image gcr.io/${PROJECT_ID}/tg-channel-merge --set-env-vars PROJECT_ID=${PROJECT_ID}
```

6. Select `Yes` to `Allow unauthenticated invocations to [tg-channel-merge]`
7. Copy out the URL of the Slack app, e.g. `https://slack-bot-ext-merge-test-xxxxx-nw.a.run.app`

### Finishing Setup in Slack App UI
1. Go to your app at [Slack App UI](https://api.slack.com/apps)
2. Slack commands
   * Replace the Request URL of all slash commands to `https://slack-bot-ext-merge-test-xxxxx-nw.a.run.app/slack/events`
3. Event Subscription
   * Replace the Request URL to `https://slack-bot-ext-merge-test-xxxxx-nw.a.run.app/slack/events`
* Download the [Twingate Logo](https://github.com/Twingate-Labs/slack-bot-ext-merge/blob/master/Twingate%20Logo%20%E2%80%93%C2%A0Icon.png) and change the logo of the Slack app at the Basic Info