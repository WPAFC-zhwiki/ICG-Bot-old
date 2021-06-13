const Discord = require('discord.js')
    , moment = require('moment')
    , db = require("quick.db")
    , fetch = require("node-fetch")
    , { JSDOM } = require('jsdom')

const config = require(process.cwd() + '/util/config.js'),
      fn = require(process.cwd() + '/util/fn.js')

module.exports = {
	name: "waitlist",
	usage: "waitlist",
  aliases: ["候審","候审"],
	description: "查看積壓狀況",
	runDiscord: async (client, message, args, shared) => {
    try {
      let { list } = await fn.getBacklogInfo(fn.mwbot)
      let i = -1, len = 0, j = 0, s = 0
      for (page of list) {
        let link = `[${page.title}](https://zhwp.org/${page.title})\n`
        if (len + link.len > 2048) { j++; len = 0; s = i }
        if (j == args[0]) break;
        i++;
        len += link.length
      }
  
      message.channel.send(
        new Discord.MessageEmbed()
          .setColor(
            config.embedColor
          )
          .setTitle("候審草稿列表")
          .setDescription(
            list.map(page => `[${page.title}](https://zhwp.org/${page.title.replace(/ /g,"_")})\n`).slice(s, i+1).join('')
          )
          .setTimestamp().setFooter(`顯示第 ${s + 1} 至 ${i + 1} 項（共 ${list.length} 項）`)
      )
    } catch (error) {
      console.error(error)
    }
	},
  runTelegram: async (client, message, args, shared) => {
    try {
      let { list } = await fn.getBacklogInfo(fn.mwbot)
      let i = -1, len = 0, j = 0, s = 0, l = list.length
      for (page of list) {
        let link = `[${page.title}](https://zhwp.org/${page.title.replace(/ /g,"_").replace(/\(/g,"%28").replace(/\)/g,"%29")})\n`
        if (len + link.len > (4096 - 31)) { j++; len = 0; s = i }
        if (j == args[0]) break;
        i++;
        len += link.length
      }
  
      client.sendMessage( message.chat.id,
        "*候審草稿列表*\n" + 
        list.map(page => `[${page.title}](https://zhwp.org/${page.title.replace(/ /g,"_").replace(/\(/g,"%28").replace(/\)/g,"%29")})\n`).slice(s, i+1).join('') + 
        `顯示第 ${s + 1} 至 ${i + 1} 項（共 ${list.length} 項）`, {
          parse_mode: "Markdown",
          disable_web_page_preview: true
        }
      )
    } catch (error) {
      console.error(error)
    }
	},
}