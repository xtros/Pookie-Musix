const Reconnect = require("../../../settings/models/247.js");

module.exports.run = async (client, player) => {
    console.log(`[DEBUG] Player Created from (${player.guildId})`);
    if (player.voiceChannel) {
        await client.updateVoiceStatus(player.guildId, player.voiceChannel, "use /play to play the music", "idle");

        // Auto-enable 24/7 mode by default when player is created
        try {
            const data = await Reconnect.findOne({ guild: player.guildId });
            if (!data) {
                await Reconnect.create({
                    guild: player.guildId,
                    text: player.textChannel,
                    voice: player.voiceChannel,
                    time: Date.now(),
                });
                console.log(`[INFO] Auto-enabled 24/7 mode for guild: ${player.guildId}`);
            }
        } catch (error) {
            console.error(`[ERROR] Failed to auto-enable 24/7 mode:`, error);
        }
    }
};
