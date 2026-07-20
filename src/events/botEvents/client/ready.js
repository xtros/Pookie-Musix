const { ActivityType, ChannelType } = require("discord.js");

const cron = require("node-cron");
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports.run = async (client) => {
    await client.poru.init(client, {
        shards: client.cluster.info.TOTAL_SHARDS,
        clientName: client.user.username,
        clientId: client.user.id,
    });

    setInterval(async () => {
        const promises = [
            client.cluster.broadcastEval("this.guilds.cache.size"),
            client.cluster.broadcastEval((c) => c.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)),
        ];

        const results = await Promise.all(promises);

        const servers = results[0].reduce((acc, guildCount) => acc + guildCount, 0);
        const members = results[1].reduce((acc, memberCount) => acc + memberCount, 0);

        const status = [
            { type: ActivityType.Playing, name: "with magical ribbons 🎀✨" },
            { type: ActivityType.Listening, name: "your sweet melodies 🌸🎶" },
            { type: ActivityType.Watching, name: `over ${members} pookies in ${servers} servers 💖` },
            { type: ActivityType.Playing, name: "/help | 🎀 Pookie Musix" },
        ];

        const index = Math.floor(Math.random() * status.length);

        await client.user.setStatus("online");       
        client.user.setActivity(status[index].name, { type: status[index].type });
    }, 4000);

    // Message sweeper cron job
    cron.schedule("0 */12 * * *", async () => {
        console.log(`[SWEEPER] Starting 12-hour message sweep on Cluster ${client.cluster.id}...`);
        
        for (const [guildId, guild] of client.guilds.cache) {
            try {
                const channels = await guild.channels.fetch().catch(() => null);
                if (!channels) continue;

                for (const [channelId, channel] of channels) {
                    if (!channel || !channel.isTextBased()) continue;

                    try {
                        const messages = await channel.messages.fetch({ limit: 100 }).catch(() => null);
                        if (!messages) continue;

                        const botMessages = messages.filter(
                            (msg) => msg.author.id === client.user.id && (Date.now() - msg.createdTimestamp) < 14 * 24 * 60 * 60 * 1000
                        );

                        if (botMessages.size > 0) {
                            await channel.bulkDelete(botMessages, true).catch(() => {});
                        }
                    } catch (e) {
                        // ignore errors like missing permissions
                    }
                    
                    // Delay to prevent rate limits
                    await delay(1000);
                }
            } catch (err) {
                console.error(`[SWEEPER ERROR] Guild ${guildId}:`, err);
            }
        }
        
        console.log(`[SWEEPER] Completed message sweep on Cluster ${client.cluster.id}!`);
    });

    console.log(`[INFO] ${client.user.username} is ready with ${client.guilds.cache.size} server`);
};
