const { ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");
const formatDuration = require("../../../structures/FormatDuration.js");
const { getSpotifyCover, searchSpotifyTrack, DEFAULT_COVER_IMAGE } = require("../../../structures/SpotifyCover.js");

const cleanTitle = (title) => {
    if (!title) return "Unknown";
    let cleaned = title.split('|')[0];
    
    // If there are 2 or more hyphens, take the first part (likely Song - Artist - Show format)
    if (cleaned.split('-').length >= 3) {
        cleaned = cleaned.split('-')[0];
    }
    
    return cleaned
        .replace(/\s*[\(\[][^)]*(?:music video|video song|official video|official music video|official audio|lyrical video|lyric video|lyrical|lyrics|audio|hd|4k|mv|m\/v)[^)]*[\)\]]/gi, "")
        .replace(/\s*-\s*(?:music video|video song|official video|official music video|official audio|lyric video|lyrics|audio|mv|m\/v)\s*/gi, "")
        .replace(/\s*\|\s*(?:official video|official music video|music video|lyric video|video song|official audio|lyrics|audio|mv|m\/v)\s*/gi, "")
        .replace(/\s+\b(?:m\/v|mv)\b/gi, "")
        .trim();
};

module.exports = {
    name: "play",
    description: "Play your favorite song/s.",
    category: "Music",
    options: [
        {
            name: "query",
            description: "Provide song name/url.",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    permissions: {
        bot: ["Speak", "Connect"],
        channel: ["Speak", "Connect"],
        user: [],
    },
    settings: {
        inVc: true,
        sameVc: false,
        player: false,
        current: false,
        owner: false,
        premium: false,
    },
    run: async (client, interaction) => {
        let player = client.poru.players.get(interaction.guild.id);

        let voiceChannel = interaction.customVoiceChannel || interaction.member.voice.channel;

        if (player && voiceChannel && voiceChannel.id !== interaction.guild.members.me.voice.channelId) {
            const embed = new EmbedBuilder()
                .setColor(client.color)
                .setDescription(`\`❌\` | You must be on the same voice channel as mine to use this command.`)
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true }).catch(() => {});
        }

        await interaction.deferReply({ ephemeral: false });

        let song = interaction.options.getString("query");

        const isUrl = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/\S*)?$/.test(song);
        if (!isUrl) {
            console.log(`[DEBUG] Original play query: "${song}"`);
            try {
                const spotifyTrack = await searchSpotifyTrack(client, song);
                if (spotifyTrack) {
                    console.log(`[DEBUG] Spotify search matched: "${spotifyTrack.title}" by "${spotifyTrack.artist}"`);
                    const cleanTitle = spotifyTrack.title.replace(/[^a-zA-Z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
                    const cleanArtist = spotifyTrack.artist.replace(/[^a-zA-Z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
                    song = `${cleanTitle} ${cleanArtist} audio`;
                    console.log(`[DEBUG] Rewritten query: "${song}"`);
                } else {
                    console.log(`[DEBUG] Spotify search returned NO match.`);
                }
            } catch (err) {
                console.error("[ERROR] Pre-search Spotify lookup failed:", err);
            }
        }

        // This will force the playSource config to be set as 'spotify' if the config.js or .env file has 'disableYouTube' set to 'true' and the playSource value you set in the config.js is one of the constants in the 'youtube' array below.
        let source = client.config.playSource;

        const youtube = ["youtube", "youtube_music", "ytsearch", "ytmsearch", "youtubemusic", "youtube music"];

        if (client.config.disableYouTube === true && youtube.includes(source)) source = "spotify";
        // This will not prevent the user to use a direct youtube url!!!
        // if you want to pass a "return" response to the user when you disable youtube, do some searching on the internet for how to do that!!!

        if (!player) {
            player = await client.poru.createConnection({
                guildId: interaction.guild.id,
                voiceChannel: voiceChannel.id,
                textChannel: interaction.channel.id,
                region: voiceChannel.rtcRegion || undefined,
                deaf: true,
            });
        }

        const res = await client.poru.resolve({ query: song, source: source, requester: interaction.member });
        const { loadType, tracks, playlistInfo } = res;

        if (player.state !== "CONNECTED") player.connect();

        if (loadType === "PLAYLIST_LOADED" || loadType === "playlist") {
            for (const track of res.tracks) {
                track.info.requester = interaction.member;
                await player.queue.add(track);
            }

            const durationTotal = res.tracks.reduce((acc, t) => acc + (t.info.length || 0), 0);
            const durationText = formatDuration(durationTotal);
            const playlistThumbnail = res.tracks[0]?.info.image || "https://i.postimg.cc/SRGS9TGz/mainlogo.png";

            const embed = new EmbedBuilder()
                .setColor(client.color)
                .setTitle("Track Added")
                .setDescription(`**${playlistInfo.name}** • \`${res.tracks.length}\` tracks added to queue.\n\nPosition \`#${player.queue.length - res.tracks.length + 1}\` · Duration: \`${durationText}\` · By: \`${interaction.member.user.username}\``)
                .setThumbnail(playlistThumbnail);

            await interaction.editReply({ embeds: [embed] });
            
            if (!player.isPlaying && !player.isPaused) {
                player.play();
                setTimeout(() => {
                    interaction.deleteReply().catch((e) => {});
                }, 2000);
            }
        } else if (loadType === "SEARCH_RESULT" || loadType === "TRACK_LOADED" || loadType === "search" || loadType === "track") {
            const track = tracks.shift();

            track.info.requester = interaction.member;

            // Block YouTube Paid Movies/Shows and verify non-Spotify tracks exist on Spotify
            const isPaidMovie = /•\s*\d{4}/.test(track.info.author);
            let isVerified = true;

            if (track.info.uri && !track.info.uri.includes("spotify")) {
                isVerified = false;
                try {
                    const spotifyData = await getSpotifyCover(client, track);
                    if (spotifyData && spotifyData.image && spotifyData.image !== DEFAULT_COVER_IMAGE) {
                        isVerified = true;
                    }
                } catch (e) {
                    console.error("[ERROR] Spotify verification failed:", e);
                }
            }

            if (isPaidMovie || !isVerified) {
                const embed = new EmbedBuilder()
                    .setColor(client.color)
                    .setDescription(`\`❌\` | This track could not be verified as a music song on Spotify (likely a movie, paid show, or non-music video) and was blocked.`);
                return interaction.editReply({ embeds: [embed] });
            }

            await player.queue.add(track);

            // If an autoplay song is currently playing, skip it so the user's request plays immediately
            if (player.isPlaying && player.currentTrack?.info?.isAutoplayTrack) {
                // Move user's track to the front of the queue so it plays right after the skip
                const userTrack = player.queue.pop();
                player.queue.unshift(userTrack);
                player.skip();
            }

            let trackImage = track.info.artworkUrl || track.info.image || (track.info.identifier && track.info.uri && (track.info.uri.includes("youtube") || track.info.uri.includes("youtu.be")) ? `https://img.youtube.com/vi/${track.info.identifier}/hqdefault.jpg` : DEFAULT_COVER_IMAGE);
            try {
                const spotifyData = await getSpotifyCover(client, track);
                if (spotifyData && spotifyData.image) {
                    trackImage = spotifyData.image;
                }
            } catch (e) {
                // Ignore and use default track image
            }

            const durationText = track.info.isStream ? "LIVE" : formatDuration(track.info.length);
            const authorText = track.info.author ? track.info.author : "Unknown Artist";
            const cleanedTitle = cleanTitle(track.info.title);

            const embed = new EmbedBuilder()
                .setColor(client.color)
                .setTitle("Track Added")
                .setDescription(`**${cleanedTitle}** by \`${authorText}\` added to queue.\n\nPosition \`#${player.queue.length}\` · Duration: \`${durationText}\` · By: \`${interaction.member.user.username}\``)
                .setThumbnail(trackImage);

            const msg = await interaction.editReply({ embeds: [embed] });
            track.info.addedMessage = msg;
            
            if (!player.isPlaying && !player.isPaused) {
                player.play();
                setTimeout(() => {
                    interaction.deleteReply().catch((e) => {});
                }, 2000);
            }
        } else if (loadType === "LOAD_FAILED" || loadType === "NO_MATCHES" || loadType === "empty" || loadType === "error") {
            const embed = new EmbedBuilder().setColor(client.color).setDescription(`\`❌\` | Song was not found or Failed to load song!`);

            return interaction.editReply({ embeds: [embed] });
        }
    },

};
