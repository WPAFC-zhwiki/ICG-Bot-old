const Discord = require('discord.js')
    , moment = require('moment')
    , db = require("quick.db")
    , fetch = require("node-fetch")
    , { JSDOM } = require('jsdom')

const config = require(process.cwd() + '/util/config.js')
    , fn = require(process.cwd() + '/util/fn.js')

module.exports = {
  name: "waitlist",
  usage: "waitlist",
  aliases: ["候審","候审"],
  description: "查看積壓狀況",
  run: async ({ dcBot, tgBot }, message, args, shared) => {
    let { list } = await fn.getBacklogInfo(fn.mwbot)
    let i = -1, len = 0, j = 0, s = 0
    for (page of list) {
      let link = `[${page.title}](https://zhwp.org/${page.title})\n`
      if (len + link.len > 2048) { j++; len = 0; s = i }
      if (j == args[0]) break;
      i++;
      len += link.length
    }
    
    let dMsg = new Discord.MessageEmbed()
      .setColor(
        config.embedColor
      )
      .setTitle("候審草稿列表")
      .setDescription(
        list.map(page => `[${page.title}](https://zhwp.org/${page.title.replace(/ /g,"_")})\n`).slice(s, i+1).join('')
      )
      .setTimestamp().setFooter(`顯示第 ${s + 1} 至 ${i + 1} 項（共 ${list.length} 項）`)
    let tMsg = "*候審草稿列表*\n" + 
      list.map(page => `[${page.title}](https://zhwp.org/${page.title.replace(/ /g,"_").replace(/\(/g,"%28").replace(/\)/g,"%29")})\n`).slice(s, i+1).join('') + 
      `顯示第 ${s + 1} 至 ${i + 1} 項（共 ${list.length} 項）`
      
    if (shared.source == "d") {
      message.channel.send(dMsg)
      if (message.channel.id == config.DCREVCHN)
        tgBot.sendMessage(config.TGREVGRP, tMsg, config.tgMsgOptions )
    }
    else if (shared.source == "t") {
      tgBot.sendMessage( message.chat.id, tMsg, config.tgMsgOptions )
      if (message.chat.id == config.TGREVGRP)
        dcBot.channels.cache.get(config.DCREVCHN).send(dMsg)
    }
  },
}