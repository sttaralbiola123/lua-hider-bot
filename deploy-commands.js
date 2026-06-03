const { REST, Routes } = require('discord.js');
const dotenv = require('dotenv');

dotenv.config();

const commands = [
  {
    name: 'hidelua',
    description: 'Upload a Roblox Lua script to LuaBin and get loadstring',
    options: [
      {
        name: 'code',
        type: 3, // STRING
        description: 'The Lua script to upload',
        required: true,
      },
    ],
  },
];

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

(async () => {
  try {
    console.log('🔄 Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log('✅ Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('❌ Error deploying commands:', error);
  }
})();
