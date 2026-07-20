const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "join",
    description: "Invite bot to your voice channel.",
    category: "Music",
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
        await interaction.deferReply({ ephemeral: false });

        let player = client.poru.players.get(interaction.guild.id);

        if (player) {
            const embed = new EmbedBuilder().setColor(client.color).setDescription(`\`❌\` | I already joined a voice channel.`);

            return interaction.editReply({ embeds: [embed] });
        }

        let voiceChannel = interaction.customVoiceChannel || interaction.member.voice.channel;

        if (!player) {
            player = await client.poru.createConnection({
                guildId: interaction.guild.id,
                voiceChannel: voiceChannel.id,
                textChannel: interaction.channel.id,
                region: voiceChannel.rtcRegion || undefined,
                deaf: true,
            });

            await player.connect();

            const embed = new EmbedBuilder()
                .setColor(client.color)
                .setDescription(`\`☑️\` | Joined to ${voiceChannel.toString()}`);

            return interaction.editReply({ embeds: [embed] });
        }
    },
};
