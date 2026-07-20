const { ClusterManager } = require("discord-hybrid-sharding");
require("dotenv").config();
config = require("./settings/config.js");

const isTokenValid = (t) => t && t.split('.').length === 3;

const manager = new ClusterManager(`${__dirname}/index.js`, {
    totalShards: 1,
    shardsPerClusters: 5,
    totalClusters: 1,
    mode: "process",
    token: isTokenValid(process.env.TOKEN) ? process.env.TOKEN : config.token,
});

manager.on("clusterCreate", (cluster) => console.log(`[INFO] Bot Launched Cluster ${cluster.id}`));
manager.on("error", (err) => console.error(`[ERROR] ClusterManager emitted an error:`, err));
manager.spawn({ timeout: -1 }).catch(err => {
    console.error("[ERROR] Failed to spawn clusters:", err);
});

process.on("exit", (code) => console.log(`[MASTER] Exiting with code: ${code}`));
process.on("uncaughtException", (err) => {
    console.error(`[MASTER] Uncaught Exception:`, err);
});
process.on("unhandledRejection", (err) => {
    console.error(`[MASTER] Unhandled Rejection:`, err);
});


/**
 * @INFO
 *  Pookie Musix Bot | https://dsc.gg/xtros
 * @INFO
 * Don't Remove Credits
 * @INFO
 */