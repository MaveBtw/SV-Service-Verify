const { Client, MessageEmbed, MessageActionRow, MessageButton, MessageAttachment } = require("discord.js");
const config = require("./config.json")
const { Captcha } = require("captcha-canvas")
const captcha = new Captcha();


module.exports = async (client) => {
    // code
    client.on("interactionCreate", async (interaction) => {
      if (interaction.isCommand()) {
        let pingembed = new MessageEmbed()
        .setColor("BLUE")
        .setTitle(`${client.ws.ping} ms`)

        if (interaction.commandName == "ping") {
          interaction.reply({
            embeds: [pingembed],
            ephemeral: false,
          });
        } else if (interaction.commandName == "setup") {
          if (!interaction.member.permissions.has("MANAGE_ROLES")) {
            let embed = new MessageEmbed()
            .setColor("BLUE")
            .setTitle("Verify Permissions")
            .setDescription("Dafür haben Sie nicht genug Berechtigungen.")

            return interaction.reply({
              embeds: [embed],
              ephemeral: false,
            });
          }
  
          let verifyChannel = interaction.guild.channels.cache.get(
            config.verifyChannel
          );
          let verifyRole = interaction.guild.roles.cache.get(config.verifyRole);
  
          if (!verifyChannel || !verifyRole) {
            let embed = new MessageEmbed()
            .setTitle("Verify Error")
            .setColor("BLUE")
            .setDescription("Sie müssen erst die Informationen in der **config.json** angeben.")

            return interaction.reply({
              embeds: [embed],
              ephemeral: true,
            });
          } else {
            let embed = new MessageEmbed()
              .setColor("BLUE")
              .setTitle(`SV Service Verify`)
              .setDescription("Dies ist ein Verifizierungssystem, was bedeutet, dass Sie sich selbst verifizieren, damit wir wissen, dass Sie echt sind.")
  
            let btnrow = new MessageActionRow().addComponents([
              new MessageButton()
                .setCustomId(`v_ping`)
                .setLabel("Support")
                .setStyle("PRIMARY")
                .setEmoji("❌"),
              new MessageButton()
                .setCustomId(`v_verify`)
                .setLabel("Verifizieren")
                .setStyle("SUCCESS")
                .setEmoji("📑"),
            ]);
  
            await verifyChannel.send({
              embeds: [embed],
              components: [btnrow],
            });
  
            // changing permissions
            let role = interaction.guild.roles.everyone;
            interaction.guild.channels.cache
              .filter((ch) => ch.id !== verifyChannel.id)
              .forEach(async (ch) => {
                // changing perms of every role
                await ch.permissionOverwrites.edit(role, {
                  SEND_MESSAGES: false,
                  VIEW_CHANNEL: false,
                  READ_MESSAGE_HISTORY: false,
                  CONNECT: false,
                });
  
                // giving perms to client;
                await ch.permissionOverwrites.edit(client.user.id, {
                  SEND_MESSAGES: true,
                  VIEW_CHANNEL: true,
                  READ_MESSAGE_HISTORY: true,
                  CONNECT: true,
                  MANAGE_CHANNELS: true,
                  MANAGE_ROLES: true,
                });
                // adding perms for verify role
                await ch.permissionOverwrites.edit(verifyRole, {
                  SEND_MESSAGES: true,
                  VIEW_CHANNEL: true,
                  READ_MESSAGE_HISTORY: true,
                  CONNECT: true,
                });
              });

              let setupembed = new MessageEmbed()
              .setTitle("SV Service Verify Setup")
              .setColor("BLUE")
              .setDescription(`Verification System Setup in ${verifyChannel} and Verify Role is ${verifyRole}`)

              let setuperrorembed = new MessageEmbed()
              .setTitle("Verify Error")
              .setColor("BLUE")
              .setDescription(`${interaction.commandName} is not valid`)

            interaction.reply({
              embeds: [setupembed],
              ephemeral: true,
            });
          }
        } else {
          interaction.reply({
            embeds: [setuperrorembed],
            ephemeral: true,
          });
        }
      }
  
      if (interaction.isButton()) {
        let embed = new MessageEmbed()
        .setTitle("SV Service Verify Support")
        .setColor("BLUE")
        .setDescription("Klicke [hier](https://discord.com/invite/qdyBM6ktGd) um zum Support zu gelangen.")

        if (interaction.customId == "v_ping") {
          return interaction.reply({
            embeds: [embed],
            ephemeral: true,
          });
        } else if (interaction.customId == "v_verify") {
          // code
          let verifyRole = interaction.guild.roles.cache.get(config.verifyRole);
          if (!verifyRole) return;
  
          if (interaction.member.roles.cache.has(verifyRole.id)) {
            let embed = new MessageEmbed()
            .setTitle("SV Service Verify Information")
            .setColor("BLUE")
            .setDescription("Sie sind schon verifiziert.")

            return interaction.reply({
              embeds: [embed],
              ephemeral: true,
            });
          } else {
            if (!interaction.guild.me.permissions.has("MANAGE_ROLES")) {
              let embed = new MessageEmbed()
              .setTitle("SV Service Verify Permissions")
              .setColor("BLUE")
              .setDescription("Dafür haben Sie nicht genug Berechtigungen.")

              return interaction.reply({
                embeds: [embed],
                ephemeral: true,
              });
            }
  
            // creatings captcha
            captcha.async = true;
            captcha.addDecoy();
            captcha.drawTrace();
            captcha.drawCaptcha();
  
            const captchaImage = new MessageAttachment(
              await captcha.png,
              "captcha.png"
            );
  
            let cmsg = await interaction.user.send({
              embeds: [
                new MessageEmbed()
                  .setColor("BLUE")
                  .setTitle(`SV Service Captcha Verification`)
                  .setDescription("Bitte beantworten Sie das unten angehängte Captcha.")
                  .setImage(`attachment://captcha.png`),
              ],
              files: [captchaImage],
            });
            
            let successembed = new MessageEmbed()
              .setColor("BLUE")
              .setTitle(`SV Service Verify Info`)
              .setDescription("Du hast dich erfolgreich verifiziert.")

            let dmembed = new MessageEmbed()
            .setTitle("SV Service Verify Info")
            .setColor("BLUE")
            .setDescription("Bitte beantworten sie das Captcha in ihren Privaten Narichten.")

            let failembed = new MessageEmbed()
            .setTitle("SV Service Verify Info")
            .setColor("BLUE")
            .setDescription(`Sie wurden von ${interaction.guild.name} gekickt weil Sie das Captcha falsch beantwortet haben.`)

            interaction.reply({
              embeds: [dmembed],
              ephemeral: true,
            });
  
            await cmsg.channel
              .awaitMessages({
                filter: (m) => m.author.id == interaction.user.id,
                max: 1,
                time: 1000 * 60,
                errors: ["time"],
              })
              .then(async (value) => {
                let isValid = value.first().content == captcha.text;
                if (isValid) {
                  await interaction.member.roles.add(verifyRole).catch((e) => {});
                  interaction.user.send({
                    embeds: [successembed],
                    ephemeral: true,
                  });
                } else {
                  await interaction.user.send({
                    embeds: [failembed]
                  });
                  interaction.member.kick().catch((e) => {});
                }
              })
              .catch(async (e) => {
                await interaction.user.send({
                  embeds: [failembed]
              });
                interaction.member.kick().catch((e) => {});
              });
          }
        }
      }
    });
  };