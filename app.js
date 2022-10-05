const { App } = require("@slack/bolt");
const fs = require('fs');
require("dotenv").config();
const updateDotenv = require('update-dotenv');
const {SecretManagerServiceClient} = require('@google-cloud/secret-manager');



function initApp(app){

    app.message('', async ({ message, client, say,logger }) => {
        const userResult = await client.users.info({user: message.user})
        const channelResult = await client.conversations.info({channel: message.channel})
        const chatResult = await client.chat.getPermalink({channel: channelResult.channel.id,message_ts: message.ts})

        if (channelResult.channel.name.startsWith("ext-") && !channelResult.channel.name.startsWith("ext-all")) {
            const result = await client.chat.postMessage({
                channel: mergedChannelId,
                text: `${userResult.user.real_name} from <${chatResult.permalink}|${channelResult.channel.name}>`
                // text: `${userResult.user.real_name} from <${chatResult.permalink}|${channelResult.channel.name}> said:\n${message.text}`
            });
            logString = `new msg added ${userResult.user.real_name} from <${chatResult.permalink}|${channelResult.channel.name}> said: ${message.text}`
            logger.info(logString)
            // await client.chat.postMessage({channel: logChannelId, text: `[INFO]  ${logString}`})
        } else if (channelResult.channel.name.startsWith("ext-all")){
            logString = `Channel name ${channelResult.channel.name} starts with ext-all, message Ignored`
            logger.info(logString)
            // await client.chat.postMessage({channel: logChannelId, text: `[INFO]  ${logString}`})
        } else {
            logString = `Channel name ${channelResult.channel.name} does not starts with ext-, message Ignored`
            logger.info(logString)
            // await client.chat.postMessage({channel: logChannelId, text: `[INFO]  ${logString}`})
        }
    });

    app.command("/twingate_create_ext_all_channel", async ({ command, ack, client,say ,logger}) => {
        try {
            await ack();
            const channelCreateResult = await client.conversations.create({name: "ext-all"})
            mergedChannelId = channelCreateResult.channel.id
            logString = `channel ext-all has been created with id ${channelCreateResult.channel.id}`
            logger.info(logString)
            // await client.chat.postMessage({channel: logChannelId, text: `[INFO]  ${logString}`})
            const addUserResult = await client.conversations.invite({channel: channelCreateResult.channel.id, users: command.user_id})
            logString = `added command issue user ${command.user_name} to ext-all channel`
            logger.info(logString)
            // await client.chat.postMessage({channel: logChannelId, text: `[INFO]  ${logString}`})
            await updateDotenv({
                MERGED_CHANNEL_ID: channelCreateResult.channel.id
            })
        } catch (error) {
            logger.error(error);
            // await client.chat.postMessage({channel: logChannelId, text: `[ERROR]  ${error}`})
        }
    });




    app.command("/twingate_add_all_ext_channel", async ({ command, ack, client,say ,logger}) => {
        try {
            await ack();
            const allChannelsResult = await client.conversations.list({limit: 1000})
            const extChannels = allChannelsResult.channels.filter(x => x.name.startsWith("ext-") && !x.name.startsWith("ext-all"))
            let channelJoinResult = ""
            for (const channel of extChannels) {
                channelJoinResult = await client.conversations.join({channel: channel.id})
                logString = `Bot joined channel ${channel.id}`
                logger.info(logString)
                // await client.chat.postMessage({channel: logChannelId, text: `[INFO]  ${logString}`})
            }
        } catch (error) {
            logger.error(error);
            // await client.chat.postMessage({channel: logChannelId, text: `[ERROR]  ${error}`})
        }
    });

    app.event('channel_created', async ({ event, client, logger }) => {
        try {
            // Call chat.postMessage with the built-in client
            if (event.channel.name.startsWith("ext-") && !event.channel.name.startsWith("ext-all")){
                const joinChannelResult = await client.conversations.join({channel: event.channel.id})
                logString = `Bot joined channel ${event.channel.name}`
                logger.info(logString)
                // await client.chat.postMessage({channel: logChannelId, text: `[INFO]  ${logString}`})
            } else {
                logString = `channel ${event.channel.name} is not an ext- channel, skip`
                logger.info(logString)
                // await client.chat.postMessage({channel: logChannelId, text: `[INFO]  ${logString}`})
            }
        }
        catch (error) {
            logger.error(error);
            // await client.chat.postMessage({channel: logChannelId, text: `[ERROR]  ${error}`})
        }
    });

}


let mergedChannelId = process.env.MERGED_CHANNEL_ID
// let logChannelId = process.env.LOGS_CHANNEL_ID
let logString = ""


async function accessSecretVersion (name) {
    const client = new SecretManagerServiceClient()
    const projectId = process.env.PROJECT_ID
    const [version] = await client.accessSecretVersion({
        name: `projects/${projectId}/secrets/${name}/versions/1`
    })

    // Extract the payload as a string.
    const payload = version.payload.data.toString('utf8')

    return payload
}

(async () => {
    const port = 8080
    // Initializes your app with your bot token and signing secret
    const app = new App({
        token: await accessSecretVersion('bot-token'),
        signingSecret: await accessSecretVersion('client-signing-secret')
        // socketMode:true, // enable the following to use socket mode
        // appToken: process.env.APP_TOKEN
    });
    // Start your app
    initApp(app);
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