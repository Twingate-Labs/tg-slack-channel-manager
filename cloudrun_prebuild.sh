#!/bin/sh
## Import environment variables
## Tell the container to run as CloudRun
export DEPLOY_ENV=cloudrun

## Setup variables
export PROJECT_ID=$GOOGLE_CLOUD_PROJECT
gcloud config set run/region "$GOOGLE_CLOUD_REGION"
gcloud config set project "$GOOGLE_CLOUD_PROJECT"
export SERVICE_ACCOUNT=$(gcloud iam service-accounts list --format 'value(EMAIL)' --filter 'NAME:Compute Engine default service account' --project "$PROJECT_ID") ## "NAME:$SERVICE_ACCOUNT_NAME"

## Set the current user as secretmanager.admin to the project
gcloud projects add-iam-policy-binding $GOOGLE_CLOUD_PROJECT --member=user:$(gcloud auth list --format 'value(account)') --role=roles/secretmanager.admin

## Giving the service account the secretmanager.secretAccessor role to the project
gcloud projects add-iam-policy-binding $PROJECT_ID --member=serviceAccount:$SERVICE_ACCOUNT --role=roles/secretmanager.secretAccessor

## Enable and setup secret manager
gcloud services enable secretmanager.googleapis.com
echo -n $SLACK_BOT_TOKEN | gcloud secrets create tg-slack-channel-manager-bot-token --project "$PROJECT_ID" --replication-policy=automatic --data-file=-
echo -n $SLACK_SIGNING_SECRET | gcloud secrets create tg-slack-channel-manager-client-signing-secret --project "$PROJECT_ID" --replication-policy=automatic --data-file=-