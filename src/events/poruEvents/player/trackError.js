const { EmbedBuilder } = require("discord.js");

module.exports.run = async (client, player, track, error) => {
    if (!player) return;

    const channel = client.channels.cache.get(player.textChannel);
    if (!channel) return;

    console.log(`Error when loading song! Track error is in [${player.guildId}]`);
    console.error(error);

    if (player.queue.length) {
        await player.skip();

        const embed = new EmbedBuilder().setDescription(`\`❌\` | Failed to load the track: \`Auto-Stop\``).setColor(client.color);

        return channel.send({ embeds: [embed] });
    } else {
        return player.destroy();
    }
};
