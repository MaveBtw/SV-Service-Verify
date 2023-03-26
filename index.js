const { Client } = require("discord.js");
const { token, guildId } = require("./config.json");

const client = new Client({
  intents: ["GUILDS", "GUILD_MEMBERS", "GUILD_MESSAGES", "DIRECT_MESSAGES"],
});

client.on("ready", async () => {
  console.log(`${client.user.tag} is successfully started`);

  let guild = client.guilds.cache.get(guildId);
  if (guild) {
    guild.commands.set([
      {
        name: "ping",
        description: `Check ping of the bot`,
        type: "CHAT_INPUT",
      },
      {
        name: "setup",
        description: `Setup the verification system`,
        type: "CHAT_INPUT",
      },
    ]);
  }
  // loading
  require("./verify")(client);
});

client.login(token);