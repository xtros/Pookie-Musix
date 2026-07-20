const { Client, Collection, GatewayIntentBits, Partials } = require("discord.js");
const { Poru, customFilter } = require("poru");
const { ClusterClient, getInfo } = require("discord-hybrid-sharding");
const GSearch = require("google-search-url");

class MainClient extends Client {
    constructor() {
        super({
            shards: getInfo().SHARD_LIST,
            shardCount: getInfo().TOTAL_SHARDS,
            failIfNotExists: true,
            allowedMentions: {
                parse: ["roles", "users", "everyone"],
                repliedUser: false,
            },
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
            ],
            partials: [Partials.Message, Partials.Channel, Partials.Reaction],
        });

        const client = this;

        this.config = require("./settings/config.js");
        this.emoji = require("./settings/emoji.js");
        this.color = this.config.color;
        this.prefix = this.config.prefix;
        this.owner = this.config.owner;
        this.gsearch = GSearch;
        if (!this.token) this.token = this.config.token;

        this.poru = new Poru(this, this.config.nodes, {
            ...this.config.poruOptions,
            customFilter: customFilter
        }, {
            send: (guildId, payload) => {
                const guild = this.guilds.cache.get(guildId);
                if (guild) guild.shard.send(payload);
            },
        });

        // Monkeypatch Poru's Rest.prototype.get to fix JSON parsing bug on nodes returning charset in Content-Type
        try {
            const originalAddNode = this.poru.addNode;
            this.poru.addNode = async function(options) {
                const node = await originalAddNode.call(this, options);
                if (node && node.rest) {
                    const RestProto = Object.getPrototypeOf(node.rest);
                    if (RestProto && RestProto.get && !RestProto.get.isPatched) {
                        const originalGet = RestProto.get;
                        RestProto.get = async function(path) {
                            const res = await originalGet.call(this, path);
                            if (typeof res === "string") {
                                try {
                                    return JSON.parse(res);
                                } catch (e) {
                                    // Return a valid error response object if we got HTML/text instead of JSON
                                    return { loadType: "error", data: {} };
                                }
                            }
                            return res;
                        };
                        RestProto.get.isPatched = true;
                        console.log("[PATCH] Successfully patched Poru Rest client prototype!");
                    }
                }
                return node;
            };
        } catch (err) {
            console.error("[PATCH] Failed to set up addNode interceptor:", err);
        }

        this.commands = new Collection();
        this.aliases = new Collection();
        this.slashCommands = new Collection();

        this.dev = new Set();

        ["AntiCrash", "Database", "Events", "Commands", "Slash", "Poru"].forEach((handler) => {
            require(`./handlers/${handler}`)(this);
        });

        this.cluster = new ClusterClient(this);
    }
    async updateVoiceStatus(guildId, voiceChannelId, status, type = null) {
        if (!voiceChannelId) return;
        try {
            let emojiPrefix = "";
            if (type && guildId) {
                const emojiName = type === "playing" ? "musicnote" : "babypinkribbon";
                const path = require("path");
                const emojiPath = type === "playing" 
                    ? path.join(__dirname, "../Pookie_Emojis/4740-music-note.gif")
                    : path.join(__dirname, "../Pookie_Emojis/81047-babypinkribbon.gif");
                
                const guild = this.guilds.cache.get(guildId);
                if (guild) {
                    let emoji = guild.emojis.cache.find(e => e.name === emojiName);
                    if (!emoji) {
                        try {
                            emoji = await guild.emojis.create({
                                attachment: emojiPath,
                                name: emojiName
                            });
                        } catch (err) {
                            console.error(`[ERROR] Failed to create ${emojiName} emoji:`, err);
                        }
                    }
                    if (emoji) {
                        emojiPrefix = emoji.animated ? `<a:${emoji.name}:${emoji.id}>` : `<:${emoji.name}:${emoji.id}>`;
                    }
                }
            }

            const finalStatus = emojiPrefix ? `${emojiPrefix} ${status}` : status;
            const statusText = finalStatus ? finalStatus.substring(0, 500) : "";
            await this.rest.put(`/channels/${voiceChannelId}/voice-status`, {
                body: {
                    status: statusText,
                },
            });
        } catch (err) {
            console.error(`[ERROR] Failed to update voice channel status for ${voiceChannelId}:`, err);
        }
    }
    connect() {
        return super.login(this.token);
    }
}

module.exports = MainClient;

/**
 * @INFO
 * Bot Coded by xtros | https://www.youtube.com/c/xtrosYT
 * @INFO
 *  Pookie Musix Bot | https://dsc.gg/xtros
 * @INFO
 * Don't Remove Credits
 * @INFO
 */
