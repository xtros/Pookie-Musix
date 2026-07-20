const { readdirSync } = require("node:fs");
const path = require("node:path");

module.exports = (client) => {
    const data = [];

    readdirSync("./src/commands/Slash/").forEach((dir) => {
        const commands = readdirSync(`./src/commands/Slash/${dir}/`).filter((file) => file.endsWith(".js"));

        for (const file of commands) {
            const pull = require(path.join(__dirname, `../commands/Slash/${dir}/${file}`));

            if (pull.name) {
                client.slashCommands.set(pull.name, pull);
                data.push(pull);
            } else {
                continue;
            }
        }
    });

    client.on("ready", async () => {
        // Clear global commands to avoid duplicates and caching delays
        await client.application.commands.set([]);
        console.log(`[INFO] ${client.slashCommands.size} Slash Commands Loaded!`);

        // Register per-guild for instant updates without caching delays
        client.guilds.cache.forEach(async (guild) => {
            try {
                await guild.commands.set(data);
                console.log(`[INFO] Registered commands to Guild: ${guild.name} (${guild.id})`);
            } catch (err) {
                console.log(`[WARN] Failed to register guild commands for ${guild.name}: ${err.message}`);
            }
        });
    });
};
