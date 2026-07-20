const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "autoplay",
    description: "Toggle autoplay — automatically plays related genre songs when the queue ends.",
    category: "Music",
    options: [],
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

        // Toggle the autoplay state
        player.autoplay = !player.autoplay;

        const state = player.autoplay ? "**Enabled** 🎵" : "**Disabled** ⏹️";
        const description = player.autoplay
            ? "`🔄` | Autoplay is now **enabled**! When the queue ends, I'll automatically add related genre songs from Spotify."
            : "`⏹️` | Autoplay is now **disabled**. The player will stop when the queue ends.";

        const embed = new EmbedBuilder()
            .setColor(client.color)
            .setDescription(description);

        return interaction.editReply({ embeds: [embed] });
    },
};
