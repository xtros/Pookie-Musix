const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const { DEFAULT_COVER_IMAGE } = require('./structures/SpotifyCover.js');

// Middlewares
app.use(express.json());

// Native CORS setup
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Serve the static React dashboard directly
const distPath = 'c:/Users/APPUz/Documents/me/pookie musix dashboard/dist';
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

const originalExit = process.exit;
process.exit = function(code) {
    console.error('[DEBUG] process.exit called with code:', code, new Error().stack);
    originalExit(code);
};

const MainClient = require("./PookieMusix.js");
const client = new MainClient();

client.connect();

// Database file path for persistent settings configuration
const settingsDbPath = path.join(__dirname, 'settings-db.json');

const getGuildSettings = (guildId) => {
  let db = {};
  if (fs.existsSync(settingsDbPath)) {
    try {
      db = JSON.parse(fs.readFileSync(settingsDbPath, 'utf-8'));
    } catch(e) {}
  }
  
  if (!db[guildId]) {
    db[guildId] = {
      prefix: client.config.prefix || "?p",
      volumeLimit: 100,
      djRole: 'DJ Pookie',
      alwaysOn: false,
      textNotifications: true
    };
  }
  return db[guildId];
};

const saveGuildSettings = (guildId, newSettings) => {
  let db = {};
  if (fs.existsSync(settingsDbPath)) {
    try {
      db = JSON.parse(fs.readFileSync(settingsDbPath, 'utf-8'));
    } catch(e) {}
  }
  
  db[guildId] = {
    ...getGuildSettings(guildId),
    ...newSettings
  };
  
  fs.writeFileSync(settingsDbPath, JSON.stringify(db, null, 2), 'utf-8');
  
  // Sync prefix in memory for active client commands routing
  if (db[guildId].prefix) {
    client.prefix = db[guildId].prefix;
  }
};

// API ROUTES
app.get('/api/stats', (req, res) => {
  let totalMembers = 0;
  try {
    client.guilds.cache.forEach(g => totalMembers += g.memberCount);
  } catch(e) {}
  
  let activePlayers = 0;
  try {
    client.poru.players.forEach(p => {
      if (p.isPlaying) activePlayers++;
    });
  } catch(e) {}

  res.json({
    servers: client.guilds.cache.size,
    users: totalMembers,
    activeNodes: Array.from(client.poru.nodes.values()).filter(n => n.isConnected).length,
    listeners: activePlayers,
    uptime: client.uptime || 0,
    ping: client.ws.ping || 0
  });
});

app.get('/api/guilds', (req, res) => {
  try {
    const guilds = client.guilds.cache.map(g => {
      const player = client.poru.players.get(g.id);
      return {
        id: g.id,
        name: g.name,
        icon: g.icon ? g.iconURL({ extension: 'png' }) : '🌸',
        members: g.memberCount,
        botAdded: true,
        activeListeners: player ? (g.members.me.voice.channel?.members.size - 1 || 0) : 0,
        voiceChannel: player ? g.channels.cache.get(player.voiceChannel)?.name : null
      };
    });
    
    res.json(guilds);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/player/:guildId', (req, res) => {
  const { guildId } = req.params;
  const player = client.poru.players.get(guildId);
  const guild = client.guilds.cache.get(guildId);
  
  if (!player) {
    return res.json({
      active: false,
      isPlaying: false,
      isPaused: false,
      currentTrack: null,
      queue: [],
      volume: 80,
      loopMode: 'none',
      isShuffle: false,
      voiceChannel: null,
      textChannel: null
    });
  }

  res.json({
    active: true,
    isPlaying: player.isPlaying,
    isPaused: player.isPaused,
    currentTrack: player.currentTrack ? {
      id: player.currentTrack.info.identifier,
      title: player.currentTrack.info.title,
      artist: player.currentTrack.info.author,
      duration: Math.floor(player.currentTrack.info.length / 1000),
      coverArt: player.currentTrack.info.image || DEFAULT_COVER_IMAGE,
      url: player.currentTrack.info.uri
    } : null,
    queue: player.queue.map((t, idx) => ({
      id: t.info.identifier || idx,
      title: t.info.title,
      artist: t.info.author,
      duration: Math.floor(t.info.length / 1000),
      coverArt: t.info.image || DEFAULT_COVER_IMAGE,
      url: t.info.uri
    })),
    volume: player.volume,
    loopMode: (player.loop || 'none').toLowerCase(),
    isShuffle: player.shuffle || false,
    voiceChannel: guild?.channels.cache.get(player.voiceChannel)?.name || null,
    textChannel: guild?.channels.cache.get(player.textChannel)?.name || null
  });
});

app.post('/api/player/:guildId', async (req, res) => {
  const { guildId } = req.params;
  const { action, value } = req.body;
  const guild = client.guilds.cache.get(guildId);
  
  if (!guild) {
    // If it's a simulated server, return successful mock
    return res.json({ success: true, mocked: true });
  }

  let player = client.poru.players.get(guildId);

  if (action === 'connect') {
    const { voiceChannelId, textChannelId } = req.body;
    if (!player) {
      player = await client.poru.createConnection({
        guildId,
        voiceChannel: voiceChannelId,
        textChannel: textChannelId || guild.channels.cache.find(c => c.type === 0)?.id,
        deaf: true
      });
    }
    return res.json({ success: true });
  }

  if (!player) {
    return res.status(400).json({ error: "Player not connected in voice" });
  }

  try {
    switch (action) {
      case 'play':
        if (player.isPaused) player.pause(false);
        else if (!player.isPlaying) player.play();
        break;
      case 'pause':
        player.pause(true);
        break;
      case 'skip':
        player.stop();
        break;
      case 'prev':
        player.seek(0);
        break;
      case 'seek':
        player.seek(value * 1000);
        break;
      case 'volume':
        player.setVolume(value);
        break;
      case 'loop':
        const mode = value.toUpperCase();
        if (['NONE', 'TRACK', 'QUEUE'].includes(mode)) {
          player.setLoop(mode);
        }
        break;
      case 'shuffle':
        player.setShuffle(!player.shuffle);
        break;
      case 'add':
        const source = client.config.playSource || "ytsearch";
        const resolveRes = await client.poru.resolve({ query: value, source, requester: guild.members.me });
        if (resolveRes.loadType === "PLAYLIST_LOADED" || resolveRes.loadType === "playlist") {
          for (const track of resolveRes.tracks) {
            player.queue.add(track);
          }
        } else if (resolveRes.tracks.length > 0) {
          player.queue.add(resolveRes.tracks[0]);
        }
        if (!player.isPlaying && !player.isPaused) {
          player.play();
        }
        break;
      case 'remove':
        player.queue.remove(value);
        break;
      case 'clear':
        player.queue.clear();
        break;
      case 'disconnect':
        player.destroy();
        break;
      default:
        return res.status(400).json({ error: "Invalid action" });
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/settings/:guildId', (req, res) => {
  const { guildId } = req.params;
  const settingsData = getGuildSettings(guildId);
  res.json(settingsData);
});

app.post('/api/settings/:guildId', (req, res) => {
  const { guildId } = req.params;
  saveGuildSettings(guildId, req.body);
  res.json({ success: true });
});

// React SPA routing wildcard handler: serve index.html for non-API calls
app.get(/^(?!\/api).*/, (req, res) => {
  if (fs.existsSync(path.join(distPath, 'index.html'))) {
    res.sendFile(path.join(distPath, 'index.html'));
  } else {
    res.send('Pookie Musix Dashboard Static Build Not Found. Please run npm run build first!');
  }
});

app.listen(3000, () => {
  console.log('[INFO] Dashboard APIs available at http://localhost:3000/');
});

module.exports = client;

/**
 * @INFO
 * Bot Coded by xtros | https://www.youtube.com/c/xtrosYT
 * @INFO
 *  Pookie Musix Bot | https://dsc.gg/xtros
 * @INFO
 * Don't Remove Credits
 * @INFO
 */
