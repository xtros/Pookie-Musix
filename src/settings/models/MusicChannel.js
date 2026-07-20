const mongoose = require("mongoose");

const CreateMusicChannel = mongoose.Schema({
    guild: { type: String, required: true },
    channelId: { type: String, required: true },
});

module.exports = mongoose.model("MusicChannel", CreateMusicChannel);
