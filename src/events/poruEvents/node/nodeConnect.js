const Reconnect = require("../../../settings/models/247.js");

module.exports.run = async (client, node) => {
    console.log(`[INFO] Node ${node.name} Ready!`);

    // This will auto reconnect when bot started or has been restarted
    const maindata = await Reconnect.find();

    if (maindata.length === 0) return;

    for (let data of maindata) {
        const index = maindata.indexOf(data);

        setTimeout(async () => {
            const channels = client.channels.cache.get(data.text);
            const voices = client.channels.cache.get(data.voice);

            // 247 Premium check removed

            if (!channels || !voices) return;

            try {
                await client.poru.createConnection({
                    guildId: data.guild,
                    voiceChannel: data.voice,
                    textChannel: data.text,
                    region: voices.rtcRegion || undefined,
                    deaf: true,
                });

                console.log(`[INFO] Auto ReConnect found in ${maindata.length} servers!`);
            } catch (err) {
                console.error(`[ERROR] Failed to auto-reconnect node:`, err);
            }
        }, index * 5000);
    }
    //
};
