const Discord = require('discord.js')
    , moment = require('moment')
    , db = require("quick.db")

const config = require(process.cwd() + '/util/config.js'),
      fn = require(process.cwd() + '/util/fn.js')

module.exports = {
	name: "backlog",
	usage: "backlog",
  aliases: ["積壓","积压"],
	description: "查看積壓狀況",
	runDiscord: async (client, message, args, shared) => {
    try {
      let { cnt, lvl } = await fn.getBacklogInfo(fn.mwbot)
  
      message.channel.send(
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
    } catch (error) {
      console.error(error)
    }
	},
  runTelegram: async (client, message, args, shared) => {
    try {
      let { cnt, lvl } = await fn.getBacklogInfo(fn.mwbot)
  
      client.sendMessage( message.chat.id,
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
	},
}