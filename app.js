const { App } = require("@slack/bolt");
const {SecretManagerServiceClient} = require('@google-cloud/secret-manager');

async function initApp(app){
    let extAllId = ""
    let extPartnerAllId = ""
    let logString = ""

    const channels = await app.client.conversations.list({limit: 1000, exclude_archived: true})
    const extAllChannel = channels.channels.filter(channel => channel.name === "ext-all")[0]
    if (extAllChannel !== undefined){
        extAllId = extAllChannel.id
        console.log(`[INFO] Setting ext-all channel ID: ${extAllId}`)

        const extChannels = channels.channels.filter(x => x.name.startsWith("ext-") && x.is_member !== true && x.name !== "ext-all" && x.name !== "ext-partner-all")
        let channelJoinResult = ""
        for (const channel of extChannels) {
            try {
                channelJoinResult = await app.client.conversations.join({channel: channel.id})
                logString = `Bot joined channel ${channel.id}`
                console.log(logString)
            } catch (error) {
                console.log(error);
            }
        }
    }
    const extPartnerAllChannel = channels.channels.filter(channel => channel.name === "ext-partner-all")[0]
    if (extPartnerAllChannel !== undefined){
        extPartnerAllId = extPartnerAllChannel.id
        console.log(`[INFO] Setting ext--partner-all channel ID: ${extPartnerAllId}`)
    }

    app.message('', async ({ message, ack, client, say,logger }) => {
        await ack()
        logger.info(message)
        if (message.subtype !== "bot_message"){
            const userResult = await client.users.info({user: message.user})
            const channelResult = await client.conversations.info({channel: message.channel})
            const chatResult = await client.chat.getPermalink({channel: channelResult.channel.id,message_ts: message.ts})
            if (userResult.user.real_name === undefined){
            // if (true){
                switch (true){
                    case channelResult.channel.name.startsWith("ext-all"):
                        logString = `Channel name ${channelResult.channel.name} starts with ext-all, message Ignored`
                        logger.info(logString)
                        break
                    case channelResult.channel.name.startsWith("ext-partner-all"):
                        logString = `Channel name ${channelResult.channel.name} starts with ext-partner-all, message Ignored`
                        logger.info(logString)
                        break
                    case channelResult.channel.name.startsWith("ext-partner-"):
                        if(message.text.includes("> has joined the channel" || message.text.includes("> has left the channel"))){
                            logger.info("Skipping, joining and leaving channel message")
                        } else {
                            await client.chat.postMessage({
                                channel: extPartnerAllId,
                                unfurl_links: true,
                                unfurl_media: true,
                                text: `Message from <${chatResult.permalink}|${channelResult.channel.name}>`
                            });
                            logString = `new msg added from <${chatResult.permalink}|${channelResult.channel.name}> said: ${message.text}`
                            logger.info(logString)
                        }
                        break
                    case channelResult.channel.name.startsWith("ext-"):
                        if(message.text.includes("> has joined the channel" || message.text.includes("> has left the channel"))){
                            logger.info("Skipping, joining and leaving channel message")
                        } else {
                            await client.chat.postMessage({
                                channel: extAllId,
                                unfurl_links: true,
                                unfurl_media: true,
                                text: `Message from <${chatResult.permalink}|${channelResult.channel.name}>`
                            });
                            logString = `new msg added from <${chatResult.permalink}|${channelResult.channel.name}> said: ${message.text}`
                            logger.info(logString)
                        }
                        break
                    default:
                        logString = `Channel name ${channelResult.channel.name} does not starts with ext-, message Ignored`
                        logger.info(logString)
                        break
                }
            } else {
                logger.info("Skip message, as it is from internal user.")
            }
        } else {
            logger.info("Skip message, as it is from bot.")
        }



    });

    app.command("/twingate_channel_merge_setup", async ({ command, ack, client,say ,logger}) => {
        try {
            await ack();
            const extAllCreateResult = await client.conversations.create({name: "ext-all"})
            extAllId = extAllCreateResult.channel.id
            logString = `channel ext-all has been created with id ${extAllCreateResult.channel.id}`
            logger.info(logString)
            const extAllAddUserResult = await client.conversations.invite({channel: extAllCreateResult.channel.id, users: command.user_id})
            logString = `added command issue user ${command.user_name} to ext-all channel`
            logger.info(logString)

            const extPartnerAllCreateResult = await client.conversations.create({name: "ext-partner-all"})
            extPartnerAllId = extPartnerAllCreateResult.channel.id
            logString = `channel ext-all has been created with id ${extPartnerAllCreateResult.channel.id}`
            logger.info(logString)
            const extPartnerAllAddUserResult = await client.conversations.invite({channel: extPartnerAllCreateResult.channel.id, users: command.user_id})
            logString = `added command issue user ${command.user_name} to ext-all channel`
            logger.info(logString)


            const allChannelsResult = await client.conversations.list({limit: 1000, exclude_archived: true})
            const extChannels = allChannelsResult.channels.filter(x => x.name.startsWith("ext-") && x.is_member !== true && x.name !== "ext-all" && x.name !== "ext-partner-all")
            let channelJoinResult = ""
            for (const channel of extChannels) {
                try {
                    channelJoinResult = await client.conversations.join({channel: channel.id})
                    logString = `Bot joined channel ${channel.id}`
                    logger.info(logString)
                } catch (error) {
                    console.log(error);
                }
            }
        } catch (error) {
            logger.error(error);
        }


    });

    app.command("/twingate_add_all_ext_channel", async ({ command, ack, client,say ,logger}) => {
        try {
            await ack();
            const allChannelsResult = await client.conversations.list({limit: 1000, exclude_archived: true})
            const extChannels = allChannelsResult.channels.filter(x => x.name.startsWith("ext-") && x.is_member !== true && x.name !== "ext-all" && x.name !== "ext-partner-all")
            let channelJoinResult = ""
            for (const channel of extChannels) {
                try {
                    channelJoinResult = await client.conversations.join({channel: channel.id})
                    logString = `Bot joined channel ${channel.id}`
                    logger.info(logString)
                } catch (error) {
                    console.log(error);
                }
            }
        } catch (error) {
            logger.error(error);
        }
    });

    app.event('channel_created', async ({ event, client, logger }) => {
        try {
            if (event.channel.name.startsWith("ext-")  && event.name !== "ext-all" && event.name !== "ext-partner-all"){
                const joinChannelResult = await client.conversations.join({channel: event.channel.id})
                logString = `Bot joined channel ${event.channel.name}`
                logger.info(logString)
            } else {
                logString = `channel ${event.channel.name} is not an ext- channel, skip`
                logger.info(logString)
            }
        }
        catch (error) {
            logger.error(error);
        }
    });
}

async function accessSecretVersion (name) {
    const client = new SecretManagerServiceClient()
    const projectId = process.env.PROJECT_ID
    const [version] = await client.accessSecretVersion({
        name: `projects/${projectId}/secrets/${name}/versions/1`
    })
    const payload = version.payload.data.toString('utf8')
    return payload
}

(async () => {
    const port = 8080
    const app = new App({
        token: await accessSecretVersion('tg-channel-merge-bot-token'),
        signingSecret: await accessSecretVersion('tg-channel-merge-client-signing-secret')
    });
    await initApp(app);
    await app.start(process.env.PORT || port);
    console.log(`⚡️ Slack Bolt app is running on port ${port}!`);
})();





// @todo find other uses for this later
// app.command("/twingate_env_setup", async ({ command, ack, client,say }) => {
//     try {
//         await ack();
//         const envVariables = command.text.replace('\`\`\`', '' ).replace(" ", "").split("\n")
//         let toUpdate = {}
//         for (const envVariable of envVariables){
//             let envValue = envVariable.split("=")[1]
//             if (envVariable.startsWith("SLACK_SIGNING_SECRET")){
//                 toUpdate.SLACK_SIGNING_SECRET = envValue
//             }
//             if (envVariable.startsWith("SLACK_BOT_TOKEN")){
//                 toUpdate.SLACK_BOT_TOKEN = envValue
//             }
//             if (envVariable.startsWith("APP_TOKEN")){
//                 toUpdate.APP_TOKEN = envValue
//             }
//         }
//         await updateDotenv(toUpdate)
//         console.log(`environment variables have been updated: ${JSON.stringify(toUpdate)}`)
//     } catch (error) {
//         console.log("err")
//         console.error(error);
//     }
// });


//
// app.command("/twingate_create_logs_channel", async ({ command, ack, client,say ,logger}) => {
//     try {
//         await ack();
//         const channelCreateResult = await client.conversations.create({name: "ext-all-logs"})
//         logChannelId = channelCreateResult.channel.id
//         logString = `channel ext-all-logs has been created with id ${channelCreateResult.channel.id}`
//         logger.info(logString)
//         await client.chat.postMessage({channel: logChannelId, text: `[INFO]  ${logString}`})
//         const addUserResult = await client.conversations.invite({channel: channelCreateResult.channel.id, users: command.user_id})
//         logString = `added command issue user ${command.user_name} to ext-all-logs channel`
//         logger.info(logString)
//         await client.chat.postMessage({channel: logChannelId, text: `[INFO]  ${logString}`})
//         await updateDotenv({
//             LOGS_CHANNEL_ID: channelCreateResult.channel.id
//         })
//     } catch (error) {
//         logger.error(error);
//         await client.chat.postMessage({channel: logChannelId, text: `[ERROR]  ${error}`})
//     }
// });