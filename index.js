module.exports = {}
/* --- ALL PACKAGES --- */

require("dotenv").config()
require("es6-shim")

const Discord = require('discord.js')
    , db = require('quick.db')
    , fs = require('fs')
    , fetch = require('node-fetch')
    , { JSDOM } = require('jsdom')
    , { CronJob } = require('cron')
    , TelegramBot = require('node-telegram-bot-api')
    // , irc = require('irc')
    // , NickServ = require('nickserv');

const intents = new Discord.Intents();
intents.add(
  "GUILDS", "GUILD_MEMBERS", "GUILD_BANS", "GUILD_EMOJIS", "GUILD_WEBHOOKS", "GUILD_INVITES",
  "GUILD_MESSAGES", "GUILD_MESSAGE_REACTIONS", "GUILD_MESSAGE_TYPING", "DIRECT_MESSAGES",
  "DIRECT_MESSAGE_REACTIONS", "DIRECT_MESSAGE_TYPING"
);

const dcBot = new Discord.Client({ intents });

const fn = require(process.cwd() + "/util/fn.js")
    , config = require(process.cwd() + "/util/config.js")

// const logs = new db.table("Logs")

module.exports.dcBot = dcBot

const TGREVGRP = -1001391997174
    , DCREVCHN = "852564292393238558"
    , IRCCHN = "#wikipedia-zh-afc-reviewer"

const tgToken = process.env.TELEGRAM_BOT_TOKEN

const tgBot = new TelegramBot(tgToken, {polling: true, channel_post: true});

dcBot.once("ready", async () => {
  console.log("Loading commands:")
  dcBot.commands = new Discord.Collection()
  const commandFiles = fs
    .readdirSync("./commands")
    .filter((file) => file.endsWith(".js"))
  for (const file of commandFiles) {
    const command = require(`./commands/${file}`)
    dcBot.commands.set(command.name, command)
    tgBot.commands = dcBot.commands
    console.log(`    - ${file}`)
  }

  console.log("Loading events:")
  const eventFiles = fs
    .readdirSync("./events")
    .filter((file) => file.endsWith(".js"))
  for (const file of eventFiles) {
    require(`./events/${file}`)(dcBot, tgBot)
    console.log(`    - ${file}`)
  }

  tgBot.on('message', msg => {
    let chatId = msg.chat.id
    let intLinks = (msg.text || "").match(/\[\[(.*?)(?:\|.*?)?\]\]/g)
    let links = []
    if (intLinks) for (link of intLinks) {
      let c = link.match(/\[\[(.*?)(?:\|.*?)?\]\]/)[1]
      links.push(`https://zhwp.org/${c}`)
    }
    let tLinks = (msg.text || "").match(/\{\{([^{}]*?)(?:\|[^}]*?)?\}\}(?!\})/g)
    if (tLinks) for (link of tLinks) {
      let c = link.match(/\{\{([^{}]*?)(?:\|[^}]*?)?\}\}(?!\})/)[1]
      links.push(`https://zhwp.org/Template:${c}`)
    }

    if (/ping/i.test(msg.text))
    tgBot.sendMessage(chatId, "Pong!")
    let fwdchan
    if (msg.chat.id == TGREVGRP) fwdchan = DCREVCHN
    if (!fwdchan) return;

    if (/^\(NOFWD\)/.test(msg.text)) return;
    if (links.length) tgBot.sendMessage(chatId, links.join("\n"))
    dcBot.channels.cache.get(fwdchan).send(
      `[T - ${msg.from.username}] ${msg.text || (msg.sticker ? `[Sticker] ${msg.sticker.emoji}` : msg.photo ? `[IMAGE]` : msg.document ? `[DOCUMENT]` : msg.audio ? `[AUDIO]` : msg.video ? `[VIDEO]` : "")}${links.length ? "\n" + links.join("\n") : ''}`
    )

    // ircclient.say(IRCCHN, 
    //   `[T - ${msg.from.username}] ${msg.text || (msg.sticker ? `[Sticker] ${msg.sticker.emoji}` : msg.photo ? `[IMAGE]` : msg.document ? `[DOCUMENT]` : msg.audio ? `[AUDIO]` : msg.video ? `[VIDEO]` : "")}${links.length ? "\n" + links.join("\n") : ''}`
    // );
  })

  tgBot.on("polling_error", console.log);
})

const token = process.env.DISCORD_BOT_TOKEN
    // , tokenT = process.env.TELEGRAM_BOT_TOKEN

/* --- ALL GLOBAL CONSTANTS & FUNCTIONS --- */

dcBot.login(token).then(() => {
  console.log(`AFC helper bot has logged in.`)
  fn.addLog(`DISCORD`, `AFC helper bot has logged in.`)
})

dcBot.once("ready", async () => {
  console.log(`${fn.time()} | ${dcBot.user.username} is up!`)
  dcBot.allinvites = await dcBot.guilds.cache
    .get("852562141864787998")
    .fetchInvites()
  fn.addLog(`DISCORD`, `AFC helper bot is now ready.`)

  dcBot.user.setPresence({
    // activity: { name: "you", type: "WATCHING" },
    status: "online",
  })

  var backlogNotif = new CronJob('0 0 * * * *', async () => {
    try {
      let { cnt, lvl } = await fn.getBacklogInfo(fn.mwbot)
  
      dcBot.channels.cache.get(DCREVCHN).send(
        new Discord.MessageEmbed()
          .setColor(
            lvl == 9 ? "DARK_BUT_NOT_BLACK"
              : lvl == 8 ? 0x1A0000
                : lvl == 7 ? 0x3F0000
                  : lvl == 6 ? 0x7F0000
                    : lvl == 5 ? "RED"
                      : lvl == 4 ? "ORANGE"
                        : lvl == 3 ? "YELLOW"
                          : lvl == 2 ? 0x32CD32
                            : lvl == 1 ? 0x4169e1
                              : lvl == 0 ? 0x87ceeb
                                : config.embedColor
          )
          .setTitle("條目審核積壓")
          .setDescription(
            `現時條目審核專題共有 **${cnt}** 個積壓草稿需要審核，積壓 **${lvl}** 週。`
          )
          .addField("工具欄", [
            `[待審草稿](https://zhwp.org/Category:正在等待審核的草稿)`,
            `[隨機跳轉](https://zhwp.org/Special:RandomInCategory/Category:正在等待審核的草稿)`
          ].join(" **·** "))
          .setTimestamp()
      )
  
      tgBot.sendMessage(TGREVGRP, 
        "*條目審核積壓*\n" + 
        `現時條目審核專題共有 *${cnt}* 個積壓草稿需要審核，積壓 *${lvl}* 週。\n` +
        `———\n` +
        `*工具欄*\n` + 
        [
          `[待審草稿](https://zhwp.org/Category:正在等待審核的草稿)`,
          `[隨機跳轉](https://zhwp.org/Special:RandomInCategory/Category:正在等待審核的草稿)`
        ].join(" *·* "), {
          parse_mode: "Markdown",
          disable_web_page_preview: true
        }
      )
      
    } catch (error) {
      console.error(error)
    }
  })
  backlogNotif.start()
})

dcBot.on('message', async message => {
  if (message.author.bot) return;
  let intLinks = message.content.match(/\[\[(.*?)(?:\|.*?)?\]\]/g)
  let links = []
  if (intLinks) for (link of intLinks) {
    let c = link.match(/\[\[(.*?)(?:\|.*?)?\]\]/)[1]
    links.push(`https://zhwp.org/${c}`)
  }
  let tLinks = message.content.match(/\{\{(.*?)(?:\|.*?)?\}\}/g)
  if (tLinks) for (link of tLinks) {
    let c = link.match(/\{\{(.*?)(?:\|.*?)?\}\}/)[1]
    links.push(`https://zhwp.org/Template:${c}`)
  }

  let fwdchan
  if (message.channel.id == DCREVCHN) fwdchan = TGREVGRP;
  if (!fwdchan) return;

  tgBot.sendMessage(fwdchan, `[D - ${message.author.tag}] ${message.content}${
    links.length ? "\n" + links.join("\n") : ""
  }`)
  // await fn.wait(500)
  // tgBot.sendMessage(fwdchan, )
})
// setInterval(() => {
//   let alllogs = logs.all()
//   if (alllogs.length) {
//     alllogs.forEach((log) => {
//       fn.writeLogs(log.ID)
//     })
//     fn.addLog(
//       `MAIN`,
//       `Logs have been written for ${alllogs.map((log) => log.ID)}`
//     )
//   }
// }, 120000) //2 minutes