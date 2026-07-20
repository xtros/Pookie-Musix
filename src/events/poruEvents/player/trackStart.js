const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require("discord.js");
const formatDuration = require("../../../structures/FormatDuration.js");
const GControl = require("../../../settings/models/Control.js");
const capital = require("node-capitalize");
const { createCanvas, loadImage } = require("@napi-rs/canvas");
const { getSpotifyCover, DEFAULT_COVER_IMAGE } = require("../../../structures/SpotifyCover.js");

let fontsInitialized = false;

const isCoverSong = (title) => {
    if (!title) return false;
    const coverKeywords = [/\bcover\b/i, /\bcovers\b/i, /\bcovered\b/i, /\bacoustic\b/i, /\bmusic mojo\b/i, /\bkappa\s*tv\b/i, /\bunplugged\b/i, /\brevisited\b/i, /\bremake\b/i];
    return coverKeywords.some(regex => regex.test(title));
};

const cleanTitle = (title) => {
    if (!title) return "Unknown";
    let cleaned = title.split('|')[0];
    
    // If there are 2 or more hyphens, take the first part (likely Song - Artist - Show format)
    if (cleaned.split('-').length >= 3) {
        cleaned = cleaned.split('-')[0];
    }
    
    return cleaned
        .replace(/\s*[\(\[][^)]*(?:music video|video song|official video|official music video|official audio|lyrical video|lyric video|lyrical|lyrics|audio|hd|4k|mv|m\/v)[^)]*[\)\]]/gi, "")
        .replace(/\b(?:official|video\s*song|video|audio|lyric|lyrics|screen|full\s*song|hd|4k|film\s*song|movie\s*song|song)\b/gi, "")
        .replace(/\s*-\s*(?:music video|video song|official video|official music video|official audio|lyric video|lyrics|audio|mv|m\/v)\s*/gi, "")
        .replace(/\s*\|\s*(?:official video|official music video|music video|lyric video|video song|official audio|lyrics|audio|mv|m\/v)\s*/gi, "")
        .replace(/\s+\b(?:m\/v|mv)\b/gi, "")
        .replace(/\s+/g, " ")
        .trim();
};

module.exports.run = async (client, player, track) => {
    // Delete the "Track Added" message of the song once it starts playing
    if (track.info.addedMessage) {
        try {
            await track.info.addedMessage.delete().catch(() => null);
        } catch (e) {
            // Ignore
        }
    }

    // Update Voice Channel Status with current song name
    if (player.voiceChannel) {
        const songName = track.info.title || "a song";
        await client.updateVoiceStatus(player.guildId, player.voiceChannel, songName, "playing");
    }

    const { initializeFonts, Bloom } = await import("musicard");
    let Control = await GControl.findOne({ guild: player.guildId });

    // This is the default setting for button control
    if (!Control) {
        Control = await GControl.create({ guild: player.guildId, playerControl: "enable" });
    }

    if (!player) return;

    const cleanedTitle = cleanTitle(track.info.title);
    let trackTitle = cleanedTitle.length > 256 ? cleanedTitle.substr(0, 256) + "..." : cleanedTitle;
    const trackDuration = track.info.isStream ? "LIVE" : formatDuration(track.info.length);
    let trackAuthor = track.info.author || "Unknown Artist";

    let trackImage = "C:\\Users\\APPUz\\Documents\\me\\Pookie Musix\\mainlogo.png";
    try {
        const spotifyData = await getSpotifyCover(client, track);
        if (spotifyData && spotifyData.image) {
            trackImage = spotifyData.image;
            if (spotifyData.title && spotifyData.title !== track.info.title) {
                const cleanSpotifyTitle = cleanTitle(spotifyData.title);
                trackTitle = cleanSpotifyTitle.length > 256 ? cleanSpotifyTitle.substr(0, 256) + "..." : cleanSpotifyTitle;
                trackAuthor = spotifyData.artist;
            }
        }
    } catch (error) {
        console.error("[ERROR] Failed to get Spotify data:", error);
    }

    // Bypass object to prevent musicard from truncating the artist name if it's too long
    const artistBypass = {
        length: 10,
        toString() { return trackAuthor; },
        [Symbol.toPrimitive](hint) { return trackAuthor; }
    };

    const currentPosition = formatDuration(0);
    const Part = 0;
    const progressBar = "▬".repeat(Part) + "🔘" + "▬".repeat(20 - Part);

    const sourceIcon = track.info.uri.includes("spotify") ? "🟢" : "🔴";
    const coverText = isCoverSong(track.info.title) ? " (Cover)" : "";

    let trackColor = client.color;
    if (trackImage && trackImage !== DEFAULT_COVER_IMAGE) {
        try {
            const imageWithTimeout = await Promise.race([
                loadImage(trackImage),
                new Promise((_, reject) => setTimeout(() => reject(new Error("Image load timeout")), 5000))
            ]);
            const canvas = createCanvas(1, 1);
            const ctx = canvas.getContext("2d");
            ctx.drawImage(imageWithTimeout, 0, 0, 1, 1);
            const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
            trackColor = "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
        } catch (e) {
            // Silently fall back to default color if image can't be loaded
        }
    }

    const { buildExtendedCard } = require("../../../structures/ExtendedMusicCard.js");

    const attachmentName = `musicard_${Math.random().toString(36).substring(2, 8)}.png`;
    let attachment = null;
    try {
        const cardBuffer = await buildExtendedCard({
            thumbnail: trackImage,
            title: trackTitle,
            artist: trackAuthor,
            duration: trackDuration
        });

        attachment = new AttachmentBuilder(cardBuffer, { name: attachmentName });
    } catch (error) {
        console.error("[ERROR] Failed to generate musicard:", error);
    }

    let nowPlayingEmoji = "🎶";
    let customPlayEmoji = null;
    let customPauseEmoji = null;
    let customLoopEmoji = null;
    try {
        const guild = client.guilds.cache.get(player.guildId);
        if (guild) {
            // Balloon Emoji
            const emojiName = "hkballoonfloat";
            const emojiPath = "C:\\Users\\APPUz\\Documents\\me\\Pookie Musix\\Muzio_Emojis\\452814-hkballoonfloat.gif";
            let customEmoji = guild.emojis.cache.find(e => e.name === emojiName);
            if (!customEmoji) {
                customEmoji = await guild.emojis.create({
                    attachment: emojiPath,
                    name: emojiName
                }).catch(() => null);
            }
            if (customEmoji) {
                nowPlayingEmoji = customEmoji.animated ? `<a:${customEmoji.name}:${customEmoji.id}>` : `<:${customEmoji.name}:${customEmoji.id}>`;
            }

            // Play Emoji (shown when paused)
            customPlayEmoji = guild.emojis.cache.find(e => e.name === "pookie_playing");
            if (!customPlayEmoji) {
                customPlayEmoji = await guild.emojis.create({
                    attachment: "C:\\Users\\APPUz\\Documents\\me\\Pookie Musix\\Muzio_Emojis\\pookie_playing.png",
                    name: "pookie_playing"
                }).catch(() => null);
            }

            // Pause Emoji (shown when playing)
            customPauseEmoji = guild.emojis.cache.find(e => e.name === "pookie_pause");
            if (!customPauseEmoji) {
                customPauseEmoji = await guild.emojis.create({
                    attachment: "C:\\Users\\APPUz\\Documents\\me\\Pookie Musix\\Muzio_Emojis\\pookie_pause.png",
                    name: "pookie_pause"
                }).catch(() => null);
            }

            // Loop Emoji
            customLoopEmoji = guild.emojis.cache.find(e => e.name === "pookie_loop");
            if (!customLoopEmoji) {
                customLoopEmoji = await guild.emojis.create({
                    attachment: "C:\\Users\\APPUz\\Documents\\me\\Pookie Musix\\Muzio_Emojis\\pookie_loop.png",
                    name: "pookie_loop"
                }).catch(() => null);
            }
        }
    } catch (e) {
        console.error("[ERROR] Emojis resolution failed:", e);
    }

    const emoji = client.emoji.button;

    const buildV2Payload = (currentPlayer, includeButtons = true) => {
        const textDisplay = {
            type: 10,
            content: `${nowPlayingEmoji} **Now Playing** — Requested by: ${track.info.requester}`
        };

        const mediaGallery = {
            type: 12,
            items: [
                {
                    media: {
                        url: attachment ? `attachment://${attachmentName}` : (trackImage.startsWith("http") ? trackImage : DEFAULT_COVER_IMAGE)
                    }
                }
            ]
        };

        const containerComponents = [textDisplay, mediaGallery];

        if (includeButtons) {
            const bPrevLocal = new ButtonBuilder().setCustomId("prev").setEmoji(emoji.previous).setStyle(ButtonStyle.Secondary);
            const pauseEmoji = currentPlayer.isPaused 
                ? (customPlayEmoji ? customPlayEmoji.id : emoji.resume) 
                : (customPauseEmoji ? customPauseEmoji.id : emoji.pause);

            const bPauseLocal = new ButtonBuilder().setCustomId("pause").setEmoji(pauseEmoji).setStyle(currentPlayer.isPaused ? ButtonStyle.Primary : ButtonStyle.Secondary);
            const bSkipLocal = new ButtonBuilder().setCustomId("skip").setEmoji(emoji.skip).setStyle(ButtonStyle.Secondary);
            const loopEmoji = customLoopEmoji ? customLoopEmoji.id : emoji.loop.none;
            const bLoopLocal = new ButtonBuilder().setCustomId("loop").setEmoji(loopEmoji).setStyle(
                currentPlayer.loop === "NONE" ? ButtonStyle.Secondary : (currentPlayer.loop === "TRACK" ? ButtonStyle.Primary : ButtonStyle.Success)
            );
            const bStopLocal = new ButtonBuilder().setCustomId("stop").setEmoji(emoji.stop).setStyle(ButtonStyle.Danger);

            const separator = {
                type: 14
            };
            containerComponents.push(separator);

            const buttonLocal = new ActionRowBuilder().addComponents(bPrevLocal, bPauseLocal, bSkipLocal, bLoopLocal, bStopLocal);

            containerComponents.push(buttonLocal.toJSON());
        }

        const containerColor = trackColor ? parseInt(trackColor.replace("#", ""), 16) : 0xff4b93;

        return {
            flags: 32768, // IS_COMPONENTS_V2
            components: [
                {
                    type: 17, // Container
                    accent_color: containerColor,
                    components: containerComponents,
                    toJSON() {
                        return this;
                    }
                }
            ]
        };
    };

    let nplaying;
    if (Control.playerControl === "disable") {
        nplaying = await client.channels.cache
            .get(player.textChannel)
            .send({ ...buildV2Payload(player, false), files: attachment ? [attachment] : [] })
            .then((x) => (player.message = x));
        return;
    }

    nplaying = await client.channels.cache
        .get(player.textChannel)
        .send({ ...buildV2Payload(player, true), files: attachment ? [attachment] : [] })
        .then((x) => (player.message = x));

    // Clear existing interval on player if present
    if (player.progressInterval) {
        clearInterval(player.progressInterval);
    }

    // Update progress bar periodically
    const intervalTime = 4000;
    player.progressInterval = setInterval(async () => {
        const currentPlayer = client.poru.players.get(player.guildId);
        if (!currentPlayer || !currentPlayer.isPlaying || currentPlayer.currentTrack !== track || !nplaying || !nplaying.editable) {
            clearInterval(player.progressInterval);
            player.progressInterval = null;
            return;
        }

        try {
            await nplaying.edit(buildV2Payload(currentPlayer, Control.playerControl !== "disable"));
        } catch (e) {
            clearInterval(player.progressInterval);
            player.progressInterval = null;
        }
    }, intervalTime);

    const filter = (message) => {
        if (message.guild.members.me.voice.channel && message.guild.members.me.voice.channelId === message.member.voice.channelId)
            return true;
        else {
            message.reply({
                content: `\`❌\` | You must be on the same voice channel as mine to use this button.`,
                ephemeral: true,
            });
        }
    };

    const collector = nplaying.createMessageComponentCollector({ filter, time: track.info.lenght });

    collector.on("collect", async (message) => {
        if (message.customId === "loop") {
            if (!player) {
                collector.stop();
            } else if (player.loop === "NONE") {
                message.deferUpdate();
                player.setLoop("TRACK");
                await nplaying.edit(buildV2Payload(player, Control.playerControl !== "disable"));
            } else if (player.loop === "TRACK") {
                message.deferUpdate();
                player.setLoop("QUEUE");
                await nplaying.edit(buildV2Payload(player, Control.playerControl !== "disable"));
            } else if (player.loop === "QUEUE") {
                message.deferUpdate();
                player.setLoop("NONE");
                await nplaying.edit(buildV2Payload(player, Control.playerControl !== "disable"));
            }
        } else if (message.customId === "stop") {
            if (!player) {
                collector.stop();
            } else {
                message.deferUpdate();
                if (player.message) await player.message.delete();
                await player.destroy();
            }
        } else if (message.customId === "pause") {
            if (!player) {
                collector.stop();
            } else if (player.isPaused) {
                message.deferUpdate();
                await player.pause(false);
                await nplaying.edit(buildV2Payload(player, Control.playerControl !== "disable"));

                // Update Voice Status on resume
                if (player.voiceChannel) {
                    const songName = track.info.title || "a song";
                    await client.updateVoiceStatus(player.guildId, player.voiceChannel, songName, "playing");
                }
            } else {
                message.deferUpdate();
                await player.pause(true);
                await nplaying.edit(buildV2Payload(player, Control.playerControl !== "disable"));

                // Update Voice Status on pause
                if (player.voiceChannel) {
                    await client.updateVoiceStatus(player.guildId, player.voiceChannel, "use /play to play the music", "idle");
                }
            }
        } else if (message.customId === "skip") {
            if (!player) {
                collector.stop();
            } else if (!player || (player.queue.length == 0 && !player.autoplay)) {
                const embed = new EmbedBuilder().setDescription(`\`❌\` | Queue is: \`Empty\``).setColor(client.color);
                return message.reply({ embeds: [embed], ephemeral: true });
            } else {
                message.deferUpdate();
                await player.skip();
            }
        } else if (message.customId === "prev") {
            if (!player) {
                collector.stop();
            } else if (!player.previousTrack) {
                const embed = new EmbedBuilder().setDescription(`\`❌\` | Previous song was: \`Not found\``).setColor(client.color);
                return message.reply({ embeds: [embed], ephemeral: true });
            } else {
                message.deferUpdate();
                await player.queue.unshift(player.previousTrack);
                await player.skip();
            }
        } else if (message.customId === "shuffle") {
            if (!player) {
                collector.stop();
            } else if (!player.queue.length) {
                const embed = new EmbedBuilder().setDescription(`\`❌\` | Queue is: \`Empty\``).setColor(client.color);
                return message.reply({ embeds: [embed], ephemeral: true });
            } else {
                message.deferUpdate();
                await player.queue.shuffle();
            }
        } else if (message.customId === "autoplay") {
            if (!player) {
                collector.stop();
            } else {
                message.deferUpdate();
                player.autoplay = !player.autoplay;
                await nplaying.edit(buildV2Payload(player, Control.playerControl !== "disable"));
            }
        }
    });
};
