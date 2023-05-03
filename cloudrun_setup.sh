#!/bin/sh
## Import environment variables
set -a
. ./tg-slack-channel-manager.conf
set +a

## Tell the container to run as CloudRun
export DEPLOY_ENV=cloudrun


## Enable and setup secret manager
gcloud services enable secretmanager.googleapis.com
gcloud projects add-iam-policy-binding $GOOGLE_CLOUD_PROJECT --member=user:$(gcloud auth list --format 'value(account)') --role=roles/secretmanager.admin
echo -n $SLACK_BOT_TOKEN | gcloud secrets create tg-slack-channel-manager-bot-token --replication-policy=automatic --data-file=-
echo -n $SLACK_SIGNING_SECRET | gcloud secrets create tg-slack-channel-manager-client-signing-secret --replication-policy=automatic --data-file=-

## Enable CloudRun and build the Docker image
gcloud services enable cloudbuild.googleapis.com
gcloud builds submit --tag gcr.io/${PROJECT_ID}/tg-slack-channel-manager .

## Deploy CloudRun
gcloud services enable run.googleapis.com
gcloud config set run/platform managed
gcloud projects add-iam-policy-binding $PROJECT_ID --member=serviceAccount:$SERVICE_ACCOUNT --role=roles/secretmanager.secretAccessor
gcloud run deploy tg-slack-channel-manager --no-cpu-throttling --allow-unauthenticated --image gcr.io/${PROJECT_ID}/tg-slack-channel-manager --set-env-vars PROJECT_ID=${PROJECT_ID}