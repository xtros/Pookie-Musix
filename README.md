# 🌸 Pookie Musix 🌸

<p align="center">
  <img src="https://i.ibb.co/2757XCwV/Chat-GPT-Image-Jul-18-2026-02-56-32-PM.png" width="100%" alt="Pookie Musix Bot Logo">
</p>

<p align="center">
  <a href="https://discord.gg/PytVQqaWyz"><img src="https://img.shields.io/discord/1514896538663522335?color=5865F2&logo=discord&logoColor=white&label=Support%20Server&v=2" alt="Discord Support"></a>
  <img src="https://img.shields.io/badge/discord.js-v14-5865F2?style=flat&logo=discord&logoColor=white" alt="Discord.js">
  <img src="https://img.shields.io/badge/Spotify-Enabled-1DB954?style=flat&logo=spotify&logoColor=white" alt="Spotify">
  <a href="https://github.com/xtros/Pookie-Musix/stargazers"><img src="https://img.shields.io/github/stars/xtros/Pookie-Musix?style=flat&color=pink" alt="GitHub stars"></a>
</p>

---

**Pookie Musix** is a premium, feature-rich Discord music bot featuring high-fidelity audio playback, custom voice channel statuses, Spotify integration, and a beautiful web-based control dashboard to manage your music queue in real-time.

Built on [Discord.js v14](https://discord.js.org/) and the [Poru](https://github.com/parasop/poru) Lavalink client wrapper, it features multi-cluster sharding support to easily scale up for large server counts.

---

## 🌟 Key Features

*   **🎵 Premium Music Playback**: Plays music from Spotify, SoundCloud, Apple Music, and search engines using Poru and Lavalink nodes.
*   **💻 Interactive Web Dashboard**: Live queue visualization, server statistics, volume adjustment, song seek control, track manipulation, and general settings modification through a React web client. *(Note: The Web Dashboard is currently under development)*
*   **⚡ Hybrid Cluster Sharding**: Utilizes `discord-hybrid-sharding` to run bot processes efficiently on multiple CPU cores.
*   **🌸 Dynamic Rich Embeds**: Styled widgets, rich buttons, custom-tailored emojis, and custom Spotify cover retrieval.
*   **🛡️ Robust Error Handling**: Configured with automated Anti-Crash protection handlers so the bot stays online.
*   **🎤 Live Voice Channel Status**: Automatically updates voice channel statuses with animated indicators displaying active music tracks.

---

## 🛠️ Prerequisites

To deploy Pookie Musix, ensure you have:
*   [Node.js](https://nodejs.org/) v18.0.0 or higher.
*   [MongoDB](https://www.mongodb.com/) Database instance.
*   One or more active [Lavalink](https://github.com/lavalink-devs/Lavalink) nodes (v3 or v4).

---

## 🚀 Setup & Installation

Follow these steps to host your own instance:

### 1. Clone the Repository
```bash
git clone https://github.com/xtros/Pookie-Musix.git
cd Pookie-Musix
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Rename the template `.env.example` file to `.env` and populate your credentials:
```bash
cp .env.example .env
```

Open the `.env` file and configure the parameters:
```env
# Discord Settings
TOKEN=YOUR_DISCORD_BOT_TOKEN
PREFIX=?p
OWNER_ID=YOUR_DISCORD_ID
GUILD_LOGS=YOUR_LOG_CHANNEL_ID
EMBED_COLOR=#ff4b93

# Spotify Credentials (Required for Spotify links resolution)
SPOTIFY_ID=YOUR_SPOTIFY_CLIENT_ID
SPOTIFY_SECRET=YOUR_SPOTIFY_CLIENT_SECRET

# Database
MONGO_URI=YOUR_MONGO_DB_CONNECTION_STRING

# Lavalink Node Config
NODE_NAME1=Node 1
NODE_HOST1=lavalink.jirayu.net
NODE_PORT1=443
NODE_PASSWORD1=youshallnotpass
NODE_SECURE1=true
```

### 4. Start the Application
Initialize the Cluster Manager sharder:
```bash
npm start
```
*The Dashboard API and client will be available locally at `http://localhost:3000/`. (Note: The Web Dashboard is currently under development)*

---

## 🎨 Emojis & Visuals Customization

Custom emojis are loaded via [emoji.js](./src/settings/emoji.js). If you want to use the customized visual assets included in this package:

1. Inspect the emojis inside [Pookie_Emojis](./Pookie_Emojis) directory.
2. Upload the emoji files (`.gif` / `.png`) directly to your Discord Server.
3. Replace the corresponding emoji IDs in `src/settings/emoji.js` with your server's new custom emoji tags: `<:emoji_name:emoji_id>` or `<a:animated_emoji_name:emoji_id>`.

---

## 📽️ Preview Screenshots

| **Dashboard Interface** | **Music Control Widget** |
| :---: | :---: |
| ![Pookie Musix Commands](https://i.ibb.co/xS6QTpxZ/help.png) | ![Pookie Musix Playing](https://i.ibb.co/ghvy6sN/player.png) |

---

## 🤝 Contributing & Support

*   💬 Join our Discord community for support: [Support Guild](https://discord.gg/PytVQqaWyz)
*   🔧 Pull Requests are welcome! Feel free to fork the repository and submit your changes.

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
Made with 💖 by **xtros**.
