### Deploy on Google CloudRun (manual)
1. Open Google [Cloud Shell](https://cloud.google.com/shell)
2. Clone the project `git clone https://github.com/Twingate-Labs/tg-slack-channel-manager.git`
3. `cd tg-slack-channel-manager`
4. Update `tg-slack-channel-manager.conf` with the configuration values described in the [README](../README.md)
6. Execute the following commands to deploy CloudRun
```
gcloud config set compute/zone europe-west2-a # change to your preferred zone
gcloud config set run/region europe-west2 # change to your preferred region
export PROJECT_ID=$(gcloud config list --format 'value(core.project)')
export SERVICE_ACCOUNT=$(gcloud iam service-accounts list --format 'value(EMAIL)' --filter 'NAME:Compute Engine default service account')
./cloudrun_setup.sh
```
7. Copy the URL of the Slack app, e.g. `https://tg-slack-channel-manager-xxxxx-nw.a.run.app`

### Deploy on Docker
1. Download `tg-slack-channel-manager.conf` template [here](../tg-slack-channel-manager.conf)
2. Update `tg-slack-channel-manager.conf` with the configuration values described in the [README](../README.md)
4. Download and run Docker container `docker run -p 8080:8080 --env-file ./tg-slack-channel-manager.conf -d --name tg-slack-channel-manager ghcr.io/twingate-labs/tg-slack-channel-manager:latest`
5. Now you should have the `tg-slack-channel-manager` container running on port 8080

### Deploy on NodeJS
_NodeJS 18+ required_
1. Clone the latest tg Slack channel manager `git clone https://github.com/Twingate-Labs/tg-slack-channel-manager.git`
2. `cd tg-slack-channel-manager`
3. Update `tg-slack-channel-manager.conf` with the configuration values described in the [README](../README.md)
4. Rename `tg-slack-channel-manager.conf` to `.env`, `mv tg-slack-channel-manager.conf .env`
5. Run `npm install`
6. Run `node app.mjs`
7. Now you should have the Slackbot running on port 8080
