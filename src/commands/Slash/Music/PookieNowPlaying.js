const { EmbedBuilder } = require("discord.js");
const formatDuration = require("../../../structures/FormatDuration.js");
const GControl = require("../../../settings/models/Control.js");
const capital = require("node-capitalize");

module.exports = {
    name: "nowplaying",
    description: "Show the current playing song.",
    category: "Music",
    permissions: {
        bot: [],
        channel: [],
        user: [],
    },
    settings: {
        inVc: true,
        sameVc: true,
        player: true,
        current: true,
        owner: false,
        premium: false,
    },
    run: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: false });

        const Control = await GControl.findOne({ guild: interaction.guild.id });

        // When button control "enable", this will make command unable to use. You can delete this
        if (Control.playerControl === "enable") {
            const ctrl = new EmbedBuilder()
                .setColor(client.color)
                .setDescription(`\`❌\` | You can't use this command as the player control was enable!`);
            return interaction.editReply({ embeds: [ctrl] });
        }

        const player = client.poru.players.get(interaction.guild.id);
        if (!player.currentTrack) return;

        try {
            const sources = capital(player.currentTrack.info.sourceName);
            const cleanTitle = (title) => {
                if (!title) return "Unknown";
                return title
                    .replace(/\s*[\(\[][^)]*(?:music video|video song|official video|official music video|official audio|lyrical video|lyric video|lyrical|lyrics|audio|hd|4k)[^)]*[\)\]]/gi, "")
                    .replace(/\s*-\s*(?:music video|video song|official video|official music video|official audio|lyric video|lyrics|audio)\s*/gi, "")
                    .replace(/\s*\|\s*(?:official video|official music video|music video|lyric video|video song|official audio|lyrics|audio)\s*/gi, "")
                    .trim();
            };

            const cleanedTitle = cleanTitle(player.currentTrack.info.title);
            const currentTitle = cleanedTitle.length > 256 ? cleanedTitle.substr(0, 256) + "..." : cleanedTitle;
            const Author =
                player.currentTrack.info.author.length > 60
                    ? player.currentTrack.info.author.substr(0, 60) + "..."
                    : player.currentTrack.info.author;
            const currentPosition = formatDuration(player.position);
            const trackDuration = formatDuration(player.currentTrack.info.length);
            const playerDuration = player.currentTrack.info.isStream ? "LIVE" : trackDuration;
            const currentAuthor = player.currentTrack.info.author ? Author : "Unknown";
            const Part = Math.floor((player.position / playerDuration) * 30);
            const Emoji = player.isPlaying ? "🕒 |" : "⏸ |";

            const embed = new EmbedBuilder()
                .setAuthor({
                    name: player.isPlaying ? `Now Playing` : `Song Paused`,
                    iconURL: "https://cdn.discordapp.com/attachments/1014342568554811443/1025740239236517908/music-disc.gif",
                })
                .setDescription(`**[${currentTitle}](${player.currentTrack.info.uri})**`)
                .addFields([
                    { name: `${client.emoji.custom_emoji.author} Author`, value: `${currentAuthor}`, inline: true },
                    { name: `${client.emoji.custom_emoji.users} Requested By`, value: `${player.currentTrack.info.requester}`, inline: true },
                    { name: `${client.emoji.custom_emoji.playlist} Source`, value: `${sources}`, inline: true },
                    { name: `${client.emoji.custom_emoji.time} Duration`, value: `${playerDuration}`, inline: true },
                    { name: `${client.emoji.custom_emoji.filters} Volume`, value: `${player.volume}%`, inline: true },
                    { name: `${client.emoji.custom_emoji.queue} Queue Left`, value: `${player.queue.length}`, inline: true },
                    {
                        name: `Song Progress: \`[${currentPosition} / ${playerDuration}]\``,
                        value: `${Emoji} ${"─".repeat(Part) + "🔵" + "─".repeat(30 - Part)}`,
                        inline: false,
                    },
                ])
                .setColor(client.color)
                .setFooter({ text: `${client.user.username}` })
                .setTimestamp();

            let trackImage = player.currentTrack.info.artworkUrl || player.currentTrack.info.image || (player.currentTrack.pluginInfo && player.currentTrack.pluginInfo.artworkUrl) || (player.currentTrack.info.identifier && player.currentTrack.info.uri && (player.currentTrack.info.uri.includes("youtube") || player.currentTrack.info.uri.includes("youtu.be")) ? `https://img.youtube.com/vi/${player.currentTrack.info.identifier}/hqdefault.jpg` : null);
            
            if (!trackImage && player.currentTrack.info.uri && player.currentTrack.info.uri.includes("spotify")) {
                const { getSpotifyCover } = require("../../../structures/SpotifyCover.js");
                try {
                    const spotifyData = await getSpotifyCover(client, player.currentTrack);
                    trackImage = spotifyData.image;
                } catch (e) {
                    trackImage = "https://i.postimg.cc/SRGS9TGz/mainlogo.png";
                }
            }

            if (trackImage) {
                embed.setImage(trackImage);
            }

            return interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.log(error);
            return interaction.reply({ content: `\`❌\` | There isn't current playing song or song has been ended!`, ephemeral: true }).catch(() => {});
        }
    },
};
