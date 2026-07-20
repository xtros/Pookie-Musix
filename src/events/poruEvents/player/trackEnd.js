module.exports.run = async (client, player, track) => {
    if (player && player.progressInterval) {
        clearInterval(player.progressInterval);
        player.progressInterval = null;
    }

    if (!player) return;

    if (player.message) await player.message.delete();

    const endedTrack = track || player.currentTrack;
    if (!endedTrack) return;

    if (player.autoplay === true) {
        const { getSpotifyRelated } = require("../../../structures/SpotifyCover.js");
        const source = client.config.playSource || "ytsearch";

        try {
            console.log(`[AUTOPLAY] Finding related songs for: "${endedTrack.info.title}" by "${endedTrack.info.author}"`);

            // Step 1: Try Spotify-based genre/artist recommendations
            const related = await getSpotifyRelated(client, endedTrack);

            if (related && related.length > 0) {
                // Pick a random related track from recommendations
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
                    await player.queue.add(nextTrack);
                    if (!player.isPlaying && !player.isPaused) player.play();
                    return;
                }
            }

            // Step 2: Fallback — search by same artist on YouTube
            console.log(`[AUTOPLAY] Spotify had no results, falling back to artist YouTube search.`);
            const fallbackQuery = `ytsearch:${endedTrack.info.author} songs`;
            const fallbackRes = await client.poru.resolve({ query: fallbackQuery, source, requester: endedTrack.info.requester });
            const fallbackTracks = (fallbackRes?.tracks || []).filter(t => t.info.title !== endedTrack.info.title);

            if (fallbackTracks.length > 0) {
                const maxIndex = Math.min(fallbackTracks.length, 5);
                const nextTrack = fallbackTracks[Math.floor(Math.random() * maxIndex)];
                nextTrack.info.requester = endedTrack.info.requester;
                await player.queue.add(nextTrack);
                if (!player.isPlaying && !player.isPaused) player.play();
            }
        } catch (error) {
            console.error("[AUTOPLAY] Error:", error);
        }
    }
};
