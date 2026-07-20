const fs = require("fs");
const path = require("path");

const logError = (msg) => {
    try {
        const logPath = path.join(__dirname, "../../crash.log");
        fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`);
    } catch (e) {}
};

module.exports = async (client) => {
    process.on("unhandledRejection", async (reason, promise) => {
        const msg = `Unhandled Rejection at: ${promise} reason: ${reason && reason.stack ? reason.stack : reason}`;
        console.log("[AntiCrash] | [UnhandledRejection_Logs] | [start] : ===============");
        console.log(msg);
        console.log("[AntiCrash] | [UnhandledRejection_Logs] | [end] : ===============");
        logError(msg);
    });

    process.on("uncaughtException", async (err, origin) => {
        const msg = `Uncaught exception: ${err && err.stack ? err.stack : err}\nException origin: ${origin}`;
        console.log("[AntiCrash] | [UncaughtException_Logs] | [Start] : ===============");
        console.log(msg);
        console.log("[AntiCrash] | [UncaughtException_Logs] | [End] : ===============");
        logError(msg);
    });

    process.on("uncaughtExceptionMonitor", async (err, origin) => {
        const msg = `Uncaught exception monitor: ${err && err.stack ? err.stack : err}\nException origin: ${origin}`;
        console.log("[AntiCrash] | [UncaughtExceptionMonitor_Logs] | [Start] : ===============");
        console.log(msg);
        console.log("[AntiCrash] | [UncaughtExceptionMonitor_Logs] | [End] : ===============");
        logError(msg);
    });

    console.log("[INFO] AntiCrash Events Loaded!");
};
