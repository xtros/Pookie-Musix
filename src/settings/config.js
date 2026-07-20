require("dotenv").config();

module.exports = {
    token: (process.env.TOKEN && process.env.TOKEN.split('.').length === 3) ? process.env.TOKEN : "", // <==== YOUR BOT TOKEN IN .env
    prefix: process.env.PREFIX || "?p", // <==== SET YOU PRERIX BOT [ OWNER COMMANDS ]
    color: process.env.EMBED_COLOR || "#ff4b93", // <==== YOU EMBEDED HEX COLOR
    owner: process.env.OWNER_ID || "", // <==== BOTS OWNER ID IN .env
    guildLogs: process.env.GUILD_LOGS || "000000000000000", // <==== YOUR SERVER JOIN LEFT LOGS CHANNEL ID
    leaveTimeout: process.env.LEAVE_TIMEOUT || "20000", // <==== SET LEAVE TIMEOUT WHEN BOT WAS ALONE || 1000 = 1sec
    disableYouTube: parseBoolean(process.env.DISABLE_YOUTUBE || "false"), // <==== SET "TRUE OR FALSE" | ENABLE/DISABLE YOUTUBE FEATURES. DISABLING THIS WILL MAKE "AUTOPLAY" COMMANDS USELESS!!!

    // ⬇⬇⬇ PORU DETAILS
    playSource: process.env.PLAY_SOURCE || "ytsearch", // <==== SET YOUR PLAY SOURCE || "ytsearch","ytmsearch","scsearch"
    poruOptions: {
        defaultPlatform: process.env.DEFAULT_SOURCE || "ytsearch", // <==== SET DEFAULT SOURCE || "ytsearch","ytmsearch","scsearch"
        clientID: process.env.SPOTIFY_ID || "", // <==== SPOTIFY CLIENT ID IN .env
        clientSecret: process.env.SPOTIFY_SECRET || "", // <==== SPOTIFY CLIENT SECRET IN .env
        reconnectTries: Infinity, // <==== TOTAL ATTEMPS TO TRY IF RECONNECT FAILED. YOU CAN CHANGE IT TO "Infinity" FOR UNLIMITED ATTEMPS.
        playlistLimit: 2, // <==== 1 = 100 TRACKS
        albumLimit: 2, // <==== 1 = 50 TRACKS
        artistLimit: 2, // <==== 1 = 50 TRACKS
        searchMarket: "IN",
    },
    nodes: [
        {
            name: process.env.NODE_NAME1 || "Node 1",
            host: process.env.NODE_HOST1 || "lavalink.jirayu.net",
            port: parseInt(process.env.NODE_PORT1 || "443"),
            password: process.env.NODE_PASSWORD1 || "youshallnotpass",
            secure: parseBoolean(process.env.NODE_SECURE1 || "true"),
            regions: process.env.NODE_REGIONS1 || ["singapore"],
        }
    ],

    mongoUri: process.env.MONGO_URI || "", // <==== YOUR MONGODB LINK IN .env
    supportUrl: process.env.SUPPORT_URL || "https://discord.gg/MqKDENVau7", // <==== YOUR SUPPORT SERVER LINK
    voteUrl: process.env.VOTE_URL || "https://discord.gg/MqKDENVau7", // <==== YOUR VOTE URL
    inviteUrl: process.env.INVITE_URL || "https://discord.com/oauth2/authorize?client_id=1526240213741867058&permissions=8&integration_type=0&scope=bot", // <==== YOUR BOT INVITE LINK
    imageUrl: process.env.IMAGE_URL || "https://i.imgur.com/HB32QqX.png", // <==== YOUR IMAGE LINK 
};

function parseBoolean(value) {
    if (typeof value === "string") {
        value = value.trim().toLowerCase();
    }
    switch (value) {
        case true:
        case "true":
            return true;
        default:
            return false;
    }
}


/**
 * @INFO
 *  Pookie Musix Bot | https://discord.gg/MqKDENVau7
 * @INFO
 * Don't Remove Credits
 * @INFO
 */