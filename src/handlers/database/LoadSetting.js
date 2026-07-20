const Ban = require("../../settings/models/Ban.js");

module.exports = async (client) => {
    client.createInteraction = async function (interaction) {
        const find_ban = await Ban.findOne({ userID: interaction.user.id });

        if (!find_ban) {
            const newBan = await Ban.create({ userID: interaction.user.id });

            await newBan.save();
        }
    };

    client.createMessage = async function (message) {
        // no-op for now since message premium setting was removed
    };
};
