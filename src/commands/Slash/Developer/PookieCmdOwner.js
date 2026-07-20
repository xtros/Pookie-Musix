const { EmbedBuilder } = require("discord.js");
const emoji = require("../../../settings/emoji.js");
module.exports = {
    name: "owner-help",
    description: "Show All Commands For Owner.",
    category: "Developer",
    permissions: {
        bot: [],
        channel: [],
        user: [],
    },
    settings: {
        inVc: false,
        sameVc: false,
        player: false,
        current: false,
        owner: true,
        premium: false,
    },
    run: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: false });

        const embed = new EmbedBuilder()
        .setTitle("Owner Commands")
        .setDescription(` \n\n ${emoji.custom_emoji.dev} **Developer Commands**\`\`\`yml\np?ban : Ban a user from using the bot.\np?maintenance : Maintenance mode.\np?eval : Bot eval.\`\`\``).setColor(client.color);

        return interaction.editReply({ embeds: [embed] });
    },
};

