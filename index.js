const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events } = require('discord.js');
const dotenv = require('dotenv');

dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

const scriptCache = new Map(); // messageId => { id, loadstring }

const API_URL = 'https://lua-hider.onrender.com/api/v1/upload';
const API_KEY = 'sttaralbiola';

client.once(Events.ClientReady, () => {
  console.log(`✅ Bot is online! Logged in as ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  // Slash Command
  if (interaction.isChatInputCommand() && interaction.commandName === 'hidelua') {
    const code = interaction.options.getString('code');
    const truncatedCode = code.length > 800 
      ? code.slice(0, 797) + '...' 
      : code;

    const loadingEmbed = new EmbedBuilder()
      .setTitle('📤 Uploading Script to LuaBin...')
      .setDescription(`\`\`\`lua\n${truncatedCode}\n\`\`\``)
      .setColor(0xf1c40f)
      .addFields({ name: '⏳ Status', value: 'Sending to server...', inline: true })
      .setFooter({ text: 'LuaBin Script Hosting' });

    await interaction.reply({ embeds: [loadingEmbed] });

    const message = await interaction.fetchReply();

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: API_KEY,
          code: code,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const successEmbed = new EmbedBuilder()
          .setTitle('✅ Script Uploaded Successfully!')
          .setColor(0x57f287)
          .addFields(
            { name: '🆔 Script ID', value: `\`${data.id}\``, inline: true },
            { name: '📏 Code Length', value: `${code.length} characters`, inline: true },
            { name: '🔧 Loadstring Command', value: `\`\`\`lua\n${data.loadstring}\n\`\`\``, inline: false },
            { name: '🔗 Direct URL', value: data.url, inline: false }
          )
          .setFooter({ text: 'Click the buttons below to copy or delete' })
          .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('copy_loadstring')
            .setLabel('📋 Copy Loadstring')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('delete_script')
            .setLabel('🗑️ Delete Script')
            .setStyle(ButtonStyle.Danger)
        );

        await interaction.editReply({ embeds: [successEmbed], components: [row] });

        // Store data for buttons
        scriptCache.set(message.id, {
          id: data.id,
          loadstring: data.loadstring,
        });
      } else {
        const errorEmbed = new EmbedBuilder()
          .setTitle('❌ Upload Failed')
          .setDescription(`**Error:** ${data.error || 'Unknown error'}`)
          .setColor(0xed4245)
          .setFooter({ text: 'Check your script and try again' });

        await interaction.editReply({ embeds: [errorEmbed] });
      }
    } catch (err) {
      console.error(err);
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Upload Failed')
        .setDescription('Failed to connect to LuaBin API.')
        .setColor(0xed4245);
      await interaction.editReply({ embeds: [errorEmbed] });
    }
  }

  // Button Interactions
  if (interaction.isButton()) {
    const messageId = interaction.message.id;
    const data = scriptCache.get(messageId);

    if (!data) {
      return interaction.reply({ content: 'This script data has expired.', ephemeral: true });
    }

    if (interaction.customId === 'copy_loadstring') {
      await interaction.reply({
        content: `\`\`\`lua\n${data.loadstring}\n\`\`\``,
        ephemeral: true,
      });
    }

    else if (interaction.customId === 'delete_script') {
      try {
        const deleteUrl = `https://lua-hider.onrender.com/api/v1/script/\( {data.id}?api_key= \){API_KEY}`;
        
        const res = await fetch(deleteUrl, { method: 'DELETE' });
        const result = await res.json();

        if (result.success) {
          await interaction.reply({ content: '✅ Script deleted successfully!', ephemeral: true });
          scriptCache.delete(messageId);
        } else {
          await interaction.reply({ content: `❌ Failed to delete: ${result.error}`, ephemeral: true });
        }
      } catch (err) {
        console.error(err);
        await interaction.reply({ content: '❌ Error contacting delete API.', ephemeral: true });
      }
    }
  }
});

client.login(process.env.BOT_TOKEN);
