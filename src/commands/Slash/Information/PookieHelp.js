const {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");
const { readdirSync } = require("fs");
const { supportUrl, inviteUrl, voteUrl } = require("../../../settings/config.js");
const { config } = require("process");
const emoji = require("../../../settings/emoji.js");

module.exports = {
    name: "help",
    description: "Display all commands of the bot.",
    category: "Information",
    permissions: {
        bot: [],
        channel: [],
        user: [],
    },
    settings: {
        inVc: false,
        sameVc: false,
        player: false,
        current: false,
        owner: false,
        premium: false,
    },
    run: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: false });

        const emojis = {
            Filters: emoji.custom_emoji.filters || "🎛️",
            Information: emoji.custom_emoji.info || "ℹ️",
            Music: emoji.custom_emoji.music || "🎵"
        };

        const categories = ["Filters", "Information", "Music"];
        
        let categoryList = "";
        categories.forEach(cat => {
            categoryList += `${emojis[cat]} : **${cat}**\n`;
        });

        const initialEmbed = new EmbedBuilder()
            .setAuthor({
                name: client.user.username,
                iconURL: client.user.displayAvatarURL() || "https://i.postimg.cc/SRGS9TGz/mainlogo.png"
            })
            .setColor(client.color)
            .setDescription(`👋🏻 Hey ${interaction.member} I am **${client.user.username}** A complete Music Bot for your server Providing you the best quality music\n\n**Links**\n[**${client.user.username}**](https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands)\n[**Support Server**](${supportUrl})\n[**Vote me**](${voteUrl})\n\n**Command Categories**\n${categoryList}`)
            .setFooter({
                text: `Thanks For Selecting ${client.user.username}!`,
                iconURL: interaction.member.displayAvatarURL({ dynamic: true }) || "https://i.postimg.cc/SRGS9TGz/mainlogo.png"
            })
            .setThumbnail(client.user.displayAvatarURL({ dynamic: true }) || "https://i.postimg.cc/SRGS9TGz/mainlogo.png")
            .setTimestamp();

        const options = categories.map(cat => {
            return new StringSelectMenuOptionBuilder()
                .setLabel(cat)
                .setValue(cat)
                .setEmoji(emojis[cat])
                .setDescription(`See commands for ${cat}`);
        });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId("help_menu")
            .setPlaceholder(`✨ Choose a command category...`)
            .addOptions(options);

        const row1 = new ActionRowBuilder().addComponents(selectMenu);

        const row2 = new ActionRowBuilder()
            .addComponents(new ButtonBuilder().setLabel(`Invite ${client.user.username}`).setURL(inviteUrl).setStyle(ButtonStyle.Link))
            .addComponents(new ButtonBuilder().setLabel("Support Server").setURL(supportUrl).setStyle(ButtonStyle.Link));

        const msg = await interaction.editReply({ embeds: [initialEmbed], components: [row1, row2] });

        const filter = (i) => i.user.id === interaction.user.id;
        const collector = msg.createMessageComponentCollector({ filter, time: 900000 });

        collector.on("collect", async (i) => {
            if (i.customId === "help_menu") {
                const selectedCategory = i.values[0];
                const cmds = client.slashCommands.filter((c) => c.category === selectedCategory);
                
                const categoryEmbed = new EmbedBuilder()
                    .setAuthor({
                        name: client.user.username,
                        iconURL: client.user.displayAvatarURL() || "https://i.postimg.cc/SRGS9TGz/mainlogo.png"
                    })
                    .setColor(client.color)
                    .setDescription(`**${emojis[selectedCategory]} ${selectedCategory} Commands**\n\n` + cmds.map((c) => `\`/${c.name}\``).join(", "))
                    .setFooter({
                        text: `Thanks For Selecting ${client.user.username}!`,
                        iconURL: interaction.member.displayAvatarURL({ dynamic: true }) || "https://i.postimg.cc/SRGS9TGz/mainlogo.png"
                    })
                    .setTimestamp();
                    
                await i.update({ embeds: [categoryEmbed] });
            }
        });

        collector.on("end", async () => {
            const disabledMenu = new StringSelectMenuBuilder()
                .setCustomId("help_menu")
                .setPlaceholder("Menu Expired!")
                .setDisabled(true)
                .addOptions(options);
            
            const disabledRow1 = new ActionRowBuilder().addComponents(disabledMenu);
            await msg.edit({ components: [disabledRow1, row2] }).catch(() => {});
        });
    },
};
