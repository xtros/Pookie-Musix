const { EmbedBuilder } = require("discord.js");
const Reconnect = require("../../../settings/models/247.js");
const { getSpotifyRelated } = require("../../../structures/SpotifyCover.js");

async function sendAutoplayNotice(channel, client, nextTrack) {
    try {
        const title = nextTrack.info.title.split("|")[0].trim();
        const author = nextTrack.info.author || "Unknown Artist";
        const embed = new EmbedBuilder()
            .setColor(client.color)
            .setAuthor({ name: "🔄  Autoplay", iconURL: client.user.displayAvatarURL() })
            .setDescription(`Now playing a related song based on your listening history.\n\n**${title}** by \`${author}\`\n\n> Use </play:0> to play your favourite songs anytime!`)
            .setFooter({ text: "Autoplay picks songs similar to what you were listening to." });

        const msg = await channel.send({ embeds: [embed] });
        setTimeout(() => msg.delete().catch(() => null), 300000);
    } catch (e) {
        // Silently fail if message can't be sent
    }
}

module.exports.run = async (client, player) => {
    if (player.voiceChannel) {
        await client.updateVoiceStatus(player.guildId, player.voiceChannel, "use /play to play the music", "idle");
    }

    const channel = client.channels.cache.get(player.textChannel);
    if (!channel) return;

    if (player.queue.length) return;

    if (player.message) await player.message.delete().catch(() => null);

    // If 247 mode is on, skip disconnecting but still handle autoplay
    const data = await Reconnect.findOne({ guild: player.guildId });

    // Handle autoplay
    if (player.autoplay) {
        const endedTrack = player.previousTrack || player.currentTrack;
        if (!endedTrack) return;

        const source = client.config.playSource || "ytsearch";

        try {
            console.log(`[AUTOPLAY] Queue ended. Finding related songs for: "${endedTrack.info.title}" by "${endedTrack.info.author}"`);

            const related = await getSpotifyRelated(client, endedTrack);

            if (related && related.length > 0) {
                const pick = related[Math.floor(Math.random() * related.length)];
                const cleanedTitle = pick.title.replace(/[^a-zA-Z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
                const cleanedArtist = pick.artist.replace(/[^a-zA-Z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
                const query = `ytsearch:${cleanedTitle} ${cleanedArtist} audio`;

                console.log(`[AUTOPLAY] Picked: "${pick.title}" by "${pick.artist}" → query: "${query}"`);

                const res = await client.poru.resolve({ query, source, requester: endedTrack.info.requester });
                const nextTracks = (res?.tracks || []).filter(t => t.info.title !== endedTrack.info.title);

                if (nextTracks.length > 0) {
                    const nextTrack = nextTracks[0];
                    nextTrack.info.requester = endedTrack.info.requester;
                    nextTrack.info.isAutoplayTrack = true;
                    await player.queue.add(nextTrack);
                    await sendAutoplayNotice(channel, client, nextTrack);
                    await player.play();
                    return;
                }
            }

            // Fallback — search by same artist on YouTube
            console.log(`[AUTOPLAY] Spotify had no results, falling back to artist YouTube search.`);
            const fallbackQuery = `ytsearch:${endedTrack.info.author} songs`;
            const fallbackRes = await client.poru.resolve({ query: fallbackQuery, source, requester: endedTrack.info.requester });
            const fallbackTracks = (fallbackRes?.tracks || []).filter(t => t.info.title !== endedTrack.info.title);

            if (fallbackTracks.length > 0) {
                const maxIndex = Math.min(fallbackTracks.length, 5);
                const nextTrack = fallbackTracks[Math.floor(Math.random() * maxIndex)];
                nextTrack.info.requester = endedTrack.info.requester;
                nextTrack.info.isAutoplayTrack = true;
                await player.queue.add(nextTrack);
                await sendAutoplayNotice(channel, client, nextTrack);
                await player.play();
                return;
            }
        } catch (error) {
            console.error("[AUTOPLAY] Error:", error);
        }
    }

    // If 247 mode is on and no autoplay, just return
    if (data) return;

    await player.destroy();

    const embed = new EmbedBuilder()
        .setDescription(`\`👋\` | Disconnected...!!! Due to queue was empty. This can be disable by using \`247\` command.`)
        .setColor(client.color);

    return channel.send({ embeds: [embed] });
};
