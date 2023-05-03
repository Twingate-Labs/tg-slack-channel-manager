import boltPkg from '@slack/bolt';
import boltSubtype from '@slack/bolt';
import dotenvPkg from 'dotenv';
import {accessSecretVersion} from "./utils.mjs";

const {App} = boltPkg;
dotenvPkg.config();


async function initApp(app, channelIds) {
    app.event('channel_created', async ({ event, logger }) => {
        try {
            if (event.channel.name.startsWith("ext-")  && event.name !== "ext-all" && event.name !== "ext-partner-all"){
                await app.client.conversations.join({channel: event.channel.id})
                logger.info(`Bot joined new channel ${event.channel.name}`)
            } else {
                logger.info(`New channel ${event.channel.name} is not an ext- channel, skip`)
            }
        }
        catch (error) {
            logger.error(error);
        }
    });

    app.message('', async ({ message, client,logger }) => {
        if (message.subtype !== "bot_message"){
            const userResult = await client.users.info({user: message.user})
            const channelResult = await client.conversations.info({channel: message.channel})
            const chatResult = await client.chat.getPermalink({channel: channelResult.channel.id,message_ts: message.ts})

            // use field userResult.user.real_name to determine if the message is sent from an external user
            if (userResult.user.real_name === undefined){
            // if (true){
                switch (true){
                    case channelResult.channel.name.startsWith("ext-all"):
                        // message from ext-all, ignore
                        break
                    case channelResult.channel.name.startsWith("ext-partner-all"):
                        // message from ext-partner-all, ignore
                        break
                    case channelResult.channel.name.startsWith("ext-partner-"):
                        if(message.text.includes("> has joined the channel" || message.text.includes("> has left the channel"))){
                            // channel joining and leaving message, ignore
                        } else {
                            await client.chat.postMessage({
                                channel: channelIds.extPartnerAllChannelId,
                                unfurl_links: true,
                                unfurl_media: true,
                                text: `Message from <${chatResult.permalink}|${channelResult.channel.name}>`
                            });
                            logger.info(`new msg added from <${chatResult.permalink}|${channelResult.channel.name}> said: ${message.text}`)
                        }
                        break
                    case channelResult.channel.name.startsWith("ext-"):
                        if(message.text.includes("> has joined the channel" || message.text.includes("> has left the channel"))){
                            // channel joining and leaving message, ignore
                        } else {
                            await client.chat.postMessage({
                                channel: channelIds.extAllChannelId,
                                unfurl_links: true,
                                unfurl_media: true,
                                text: `Message from <${chatResult.permalink}|${channelResult.channel.name}>`
                            });
                            logger.info(`new msg added from <${chatResult.permalink}|${channelResult.channel.name}> said: ${message.text}`)
                        }
                        break
                    default:
                        // no ext- channel message, ignore
                        break
                }
            } else {
                // internal user message, ignore
            }
        } else {
            // bot user messages, ignore
        }
    });


}

async function channelSetup (app) {
    const allChannelsResult = await app.client.conversations.list({limit: 1000, exclude_archived: true})
    let extAllChannelId = allChannelsResult.channels.filter(channel => channel.name === "ext-all")[0]
    let extPartnerAllChannelId = allChannelsResult.channels.filter(channel => channel.name === "ext-partner-all")[0]

    if (extAllChannelId === undefined) {
        const extAllCreateResult = await app.client.conversations.create({name: "ext-all"})
        extAllChannelId = extAllCreateResult.channel.id
        app.logger.info(`ext-all channel not found, created new ext-all channel with id ${extAllChannelId}`)
    } else {
        extAllChannelId = extAllChannelId.id
        app.logger.info(`ext-all channel found with id ${extAllChannelId}`)
    }

    if (extPartnerAllChannelId === undefined) {
        const extPartnerAllCreateResult = await app.client.conversations.create({name: "ext-partner-all"})
        extPartnerAllChannelId = extPartnerAllCreateResult.channel.id
        app.logger.info(`ext-partner-all channel not found, created new ext-partner-all channel with id ${extPartnerAllChannelId}`)
    } else {
        extPartnerAllChannelId = extPartnerAllChannelId.id
        app.logger.info(`ext-partner-all channel found with id ${extPartnerAllChannelId}`)
    }

    const extChannels = allChannelsResult.channels.filter(x => x.name.startsWith("ext-") && x.is_member !== true && x.name !== "ext-all" && x.name !== "ext-partner-all")
    for (const channel of extChannels) {
        try {
            await app.client.conversations.join({channel: channel.id})
            app.logger.info(`Bot joined ext channel ${channel.name}:${channel.id}`)
        } catch (error) {
            app.logger.info(error);
        }
    }

    return {extAllChannelId, extPartnerAllChannelId}
}


(async () => {
    const port = 8080
    let [slackToken, slackSigningSecret] = [
        process.env.SLACK_BOT_TOKEN,
        process.env.SLACK_SIGNING_SECRET
    ]
    // fetching secret from google cloud
    //todo: centralise all accessSecretVersion
    if (process.env.DEPLOY_ENV !== "docker") {
        [slackToken, slackSigningSecret] = [
            await accessSecretVersion('tg-group-profile-manager-bot-token'),
            await accessSecretVersion('tg-group-profile-manager-client-signing-secret')
        ]
    }


    const app = new App({
        token: slackToken,
        signingSecret: slackSigningSecret,
        ignoreSelf: false
    });

    const channelIds = await channelSetup(app)


    await initApp(app, channelIds);

    await app.start(process.env.PORT || port);
    console.log(`⚡️ Slack Bolt app is running on port ${port}!`);
})();