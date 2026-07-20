const { ApplicationCommandOptionType, EmbedBuilder, ChannelType, PermissionsBitField } = require("discord.js");
const MusicChannel = require("../../../settings/models/MusicChannel.js");

module.exports = {
    name: "setvc",
    description: "Set a default voice channel for the bot to join automatically.",
    category: "Music",
    options: [
        {
            name: "channel",
            description: "The voice channel to set as default",
            type: ApplicationCommandOptionType.Channel,
            required: true,
            channelTypes: [ChannelType.GuildVoice, ChannelType.GuildStageVoice],
        },
    ],
    permissions: {
        bot: [],
        channel: [],
        user: [PermissionsBitField.Flags.ManageGuild],
    },
    settings: {
        inVc: false,
        sameVc: false,
        player: false,
        current: false,
        owner: false,
        premium: false,
    },
    run: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: true });

        const channel = interaction.options.getChannel("channel");

        let vcSetting = await MusicChannel.findOne({ guild: interaction.guild.id });
        if (!vcSetting) {
            vcSetting = new MusicChannel({ guild: interaction.guild.id, channelId: channel.id });
        } else {
            vcSetting.channelId = channel.id;
        }

        await vcSetting.save();

        const embed = new EmbedBuilder()
            .setDescription(`\`✅\` | Successfully set the default music channel to ${channel}`)
            .setColor(client.color);

        return interaction.editReply({ embeds: [embed] });
    },
};
