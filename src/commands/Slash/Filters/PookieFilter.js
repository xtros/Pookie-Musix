const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");

module.exports = {
    name: "filter",
    description: "Apply a filter to the music player.",
    category: "Filters",
    options: [
        {
            name: "type",
            description: "The filter to apply",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: "Clear Filters", value: "clear" },
                { name: "8D", value: "8d" },
                { name: "BassBoost", value: "bassboost" },
                { name: "ChannelMix", value: "channelmix" },
                { name: "EarRape", value: "earrape" },
                { name: "LowPass", value: "lowpass" },
                { name: "Nightcore", value: "nightcore" },
                { name: "Rotation", value: "rotation" },
                { name: "Timescale", value: "timescale" },
                { name: "Tremolo", value: "tremolo" },
                { name: "Vaporwave", value: "vaporwave" },
                { name: "Vibrato", value: "vibrato" },
                { name: "Lo-Fi", value: "lofi" }
            ]
        }
    ],
    permissions: {
        bot: [],
        channel: [],
        user: [],
    },
    settings: {
        inVc: false,
        sameVc: true,
        player: true,
        current: true,
        owner: false,
        premium: false,
    },
    run: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: true });

        const player = client.poru.players.get(interaction.guild.id);
        const filterType = interaction.options.getString("type");

        let filterName = "None";

        switch (filterType) {
            case "clear":
                await player.filters.clearFilters();
                filterName = "Cleared";
                break;
            case "8d":
                await player.filters.set8D(true);
                filterName = "8D";
                break;
            case "bassboost":
                await player.filters.setBassboost(true);
                filterName = "BassBoost";
                break;
            case "channelmix":
                await player.filters.setChannelMix({
                    leftToLeft: 1,
                    leftToRight: 0,
                    rightToLeft: 0,
                    rightToRight: 1
                }); // Basic reset/mix or you can define an actual channelmix
                filterName = "ChannelMix";
                break;
            case "earrape":
                await player.filters.setEarrape(true);
                filterName = "EarRape";
                break;
            case "lowpass":
                await player.filters.setLowPass({ smoothing: 20 });
                filterName = "LowPass";
                break;
            case "nightcore":
                await player.filters.setNightcore(true);
                filterName = "Nightcore";
                break;
            case "rotation":
                await player.filters.setRotation({ rotationHz: 0.2 });
                filterName = "Rotation";
                break;
            case "timescale":
                await player.filters.setTimescale({ pitch: 1.1, rate: 1.1, speed: 1.1 });
                filterName = "Timescale";
                break;
            case "tremolo":
                await player.filters.setTremolo({ frequency: 2.0, depth: 0.5 });
                filterName = "Tremolo";
                break;
            case "vaporwave":
                await player.filters.setVaporwave(true);
                filterName = "Vaporwave";
                break;
            case "vibrato":
                await player.filters.setVibrato({ frequency: 2.0, depth: 0.5 });
                filterName = "Vibrato";
                break;
            case "lofi":
                await player.filters.setTimescale({ speed: 0.95, pitch: 0.95, rate: 1.0 });
                await player.filters.setEqualizer([
                    { band: 0, gain: -0.2 },
                    { band: 1, gain: -0.1 },
                    { band: 2, gain: 0.0 },
                    { band: 3, gain: 0.1 },
                    { band: 4, gain: 0.2 },
                    { band: 5, gain: 0.1 },
                    { band: 6, gain: 0.0 },
                    { band: 7, gain: -0.1 },
                    { band: 8, gain: -0.2 },
                    { band: 9, gain: -0.3 },
                    { band: 10, gain: -0.4 },
                    { band: 11, gain: -0.5 },
                    { band: 12, gain: -0.6 },
                    { band: 13, gain: -0.7 },
                    { band: 14, gain: -0.8 }
                ]);
                filterName = "Lo-Fi";
                break;
        }

        const embed = new EmbedBuilder().setDescription(`\`🔩\` | Filter has been set to: \`${filterName}\``).setColor(client.color);
        return interaction.editReply({ embeds: [embed] });
    },
};
