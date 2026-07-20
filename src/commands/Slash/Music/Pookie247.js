const { EmbedBuilder } = require("discord.js");
const Reconnect = require("../../../settings/models/247.js");

module.exports = {
    name: "247",
    description: "Toggle 24/7 mode — keeps the bot in the voice channel when the queue ends or when left alone.",
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
        current: false,
        owner: false,
        premium: false,
    },
    run: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: true });

        const player = client.poru.players.get(interaction.guild.id);
        const data = await Reconnect.findOne({ guild: interaction.guild.id });

        if (data) {
            await Reconnect.findOneAndDelete({ guild: interaction.guild.id });
            const embed = new EmbedBuilder()
                .setColor(client.color)
                .setDescription("`⏹️` | 24/7 mode is now **disabled**.");
            return interaction.editReply({ embeds: [embed] });
        } else {
            await Reconnect.create({
                guild: interaction.guild.id,
                text: interaction.channel.id,
                voice: player.voiceChannel,
                time: Date.now(),
            });
            const embed = new EmbedBuilder()
                .setColor(client.color)
                .setDescription("`🔄` | 24/7 mode is now **enabled**.");
            return interaction.editReply({ embeds: [embed] });
        }
    },
};
