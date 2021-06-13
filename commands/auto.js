const Discord = require('discord.js')
    , moment = require('moment')
    , db = require("quick.db")

const config = require(process.cwd() + '/util/config.js')
    , fn = require(process.cwd() + '/util/fn.js')

module.exports = {
  name: "backlog",
  usage: "backlog",
  aliases: ["積壓","积压"],
  description: "查看積壓狀況",
  run: async ({dcBot, tgBot}, message, args, shared) => {
    try {
      let { cnt, lvl } = await fn.getBacklogInfo(fn.mwbot)
      
      if (source == "d") {
        message.channel.send(
          new Discord.MessageEmbed()
            .setColor(config.embedColor)
            .setTitle("條目審核積壓")
            .setDescription(
              `現時條目審核專題共有 **${cnt}** 個積壓草稿需要審核，積壓 **${lvl}** 週。`
            )
            .addField(
              "工具欄",
              [
                `[待審草稿](https://zhwp.org/Category:正在等待審核的草稿)`,
                `[隨機跳轉](https://zhwp.org/Special:RandomInCategory/Category:正在等待審核的草稿)`,
              ].join(" **·** ")
            )
            .setTimestamp()
        )
        if (message.channel.id == config.DCREVCHN) {
          tgBot.sendMessage(config.TGREVGRP,
            "text"
          )
        }
      }
      else if (source == "t") {
        tgBot.sendMessage( message.chat.id,
          "text"
        )
        if (message.chat.id == config.TGREVGRP) {
          dcBot.channels.cache.get(DCREVCHN).send(
            "text"
          )
        }
      }
    } catch (error) {
      console.error(error)
    }
  }
}