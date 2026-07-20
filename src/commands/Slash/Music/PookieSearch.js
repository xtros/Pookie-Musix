const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ApplicationCommandOptionType } = require("discord.js");
const formatDuration = require("../../../structures/FormatDuration.js");
const { getSpotifyCover } = require("../../../structures/SpotifyCover.js");

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
    name: "search",
    id: "1055080810992111652",
    description: "Search for your favorite song.",
    category: "Music",
    options: [
        {
            name: "query",
            description: "Provide song name you want to search.",
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
        const query = interaction.options.getString("query");

        let player = client.poru.players.get(interaction.guild.id);

        let voiceChannel = interaction.customVoiceChannel || interaction.member.voice.channel;

        if (player && voiceChannel && voiceChannel.id !== interaction.guild.members.me.voice.channelId) {
            const warning = new EmbedBuilder()
                .setColor(client.color)
                .setDescription(`\`❌\` | You must be on the same voice channel as mine to use this command.`)
                .setTimestamp();

            return interaction.reply({ embeds: [warning], ephemeral: true }).catch(() => {});
        }

        if (/^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/.test(query)) {
            const embed = new EmbedBuilder()
                .setDescription(`\`❌\` | Please use \`/play\` command for url search query.`)
                .setColor(client.color);

            return interaction.reply({ embeds: [embed], ephemeral: true }).catch(() => {});
        }

        await interaction.deferReply({ ephemeral: false });

        // This will force the playSource config to be set as 'spotify' if the config.js or .env file has 'disableYouTube' set to 'true' and the playSource value you set in the config.js is one of the constants in the 'youtube' array below.
        let source = client.config.playSource;

        const youtube = ["youtube", "youtube_music", "ytsearch", "ytmsearch", "youtubemusic", "youtube music"];

        if (client.config.disableYouTube === true && youtube.includes(source)) source = "spotify";

        if (!player) {
            player = await client.poru.createConnection({
                guildId: interaction.guild.id,
                voiceChannel: voiceChannel.id,
                textChannel: interaction.channel.id,
                region: voiceChannel.rtcRegion || undefined,
                deaf: true,
            });
        }

        const res = await client.poru.resolve({ query: query, source: source, requester: interaction.member });
        const { tracks } = res;

        const results = tracks.slice(0, 10);

        let n = 0;

        const str = tracks
            .slice(0, 10)
            .map(
                (r) =>
                    `\`${++n}.\` **[${r.info.title.length > 20 ? r.info.title.substr(0, 25) + "..." : r.info.title}](${r.info.uri})** • ${
                        r.info.author
                    }`,
            )
            .join("\n");

        const selectMenuArray = [];

        for (let i = 0; i < results.length; i++) {
            const track = results[i];

            let label = `${i + 1}. ${track.info.title}`;

            if (label.length > 50) label = label.substring(0, 47) + "...";

            selectMenuArray.push({
                label: label,
                description: track.info.author,
                value: i.toString(),
            });
        }

        const selection = new ActionRowBuilder().addComponents([
            new StringSelectMenuBuilder()
                .setCustomId("search")
                .setPlaceholder("Please select your song here")
                .setMinValues(1)
                .setMaxValues(1)
                .addOptions(selectMenuArray),
        ]);

        const embed = new EmbedBuilder()
            .setAuthor({ name: "Seach Selection Menu", iconURL: interaction.member.displayAvatarURL({}) || "https://i.postimg.cc/SRGS9TGz/mainlogo.png" })
            .setDescription(str)
            .setColor(client.color)
            .setFooter({ text: `You have 30 seconds to make your selection through the dropdown menu.` });

        await interaction.editReply({ embeds: [embed], components: [selection] }).then((message) => {
            let count = 0;

            const selectMenuCollector = message.createMessageComponentCollector({
                time: 30000,
            });

            const toAdd = [];

            try {
                selectMenuCollector.on("collect", async (menu) => {
                    if (menu.user.id !== interaction.member.id) {
                        const unused = new EmbedBuilder().setColor(client.color).setDescription(`\`❌\` | This menu is not for you!`);

                        return menu.reply({ embeds: [unused], ephemeral: true }).catch(() => {});
                    }

                    menu.deferUpdate();

                    for (const value of menu.values) {
                        toAdd.push(tracks[value]);
                        count++;
                    }

                    for (const track of toAdd) {
                        track.info.requester = interaction.member;
                        player.queue.add(track);
                    }

                    const track = toAdd.shift();
                    const trackTitle = track.info.title.length > 15 ? track.info.title.substr(0, 15) + "..." : track.info.title;

                    let trackImage = track.info.artworkUrl || track.info.image || (track.info.identifier && track.info.uri && (track.info.uri.includes("youtube") || track.info.uri.includes("youtu.be")) ? `https://img.youtube.com/vi/${track.info.identifier}/hqdefault.jpg` : "https://i.postimg.cc/SRGS9TGz/mainlogo.png");
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

                    const tplay = new EmbedBuilder()
                        .setColor(client.color)
                        .setTitle("Track Added")
                        .setDescription(`**${cleanedTitle}** by \`${authorText}\` added to queue.\n\nPosition \`#${player.queue.length}\` · Duration: \`${durationText}\` · By: \`${interaction.member.user.username}\``)
                        .setThumbnail(trackImage || "https://i.postimg.cc/SRGS9TGz/mainlogo.png");

                    await message.edit({ embeds: [tplay], components: [] });
                    
                    if (!player.isPlaying && !player.isPaused) {
                        player.play();
                        setTimeout(() => {
                            interaction.deleteReply().catch((e) => {});
                        }, 2000);
                    }
                });

                selectMenuCollector.on("end", async (collected) => {
                    if (!collected.size) {
                        const timed = new EmbedBuilder().setColor(client.color).setDescription(`\`❌\` | Search was time out.`);

                        await message.edit({ embeds: [timed], components: [] });
                    }
                });
            } catch (e) {
                console.log(e);
            }
        });
    },
};
