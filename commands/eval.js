const Discord = require('discord.js'),
      moment = require('moment'),
      db = require("quick.db")

const config = require(process.cwd() + '/util/config.js'),
      fn = require(process.cwd() + '/util/fn.js')

const TGREVGRP = -1001391997174
    , DCREVCHN = "852564292393238558"
    , IRCCHN = "#wikipedia-zh-afc-reviewer"

module.exports = {
	name: "eval",
	usage: "eval <code>",
	description: "Evaluate JavaScript code!",
  // category: "Bot Staff",
  // botStaffOnly: true,
  runDiscord: async (client, message, args, shared) => {
    if (
      message.author.id !== config.owner
    )
      return undefined
    
    const msg = message, bot = client
    
    let modifier = "-e"
    
    if (args[args.length-1] == "-t" || args[args.length-1] == "-l" || args[args.length-1] == "-e") {
      modifier = args.pop()
    }

		try {
			var out = eval(args.join(' '))
			out = JSON.stringify(out)
      if (out === undefined) out = "undefined"
      var input = args.join(' ').substring(0, 1024)
      
      if (modifier == "-e" && out.length <= 1024-8) await message.channel.send(
        new Discord.MessageEmbed()
          .setColor("GREEN")
          .setTitle(`${fn.getEmoji(client, 'green_tick')} Evaluation Success!`)
          .addField(`Expression`, `\`\`\`js\n${args.join(" ")}\`\`\``)
          .addField(`Result`, `\`\`\`js\n${out}\`\`\``)
          .setFooter(client.user.username, client.user.avatarURL({ format: 'png', dynamic: true, size: 1024 }))
      ).catch(console.error)
      else if (out.length <= 2000-8 && (modifier == "-t" || (modifier == "-e" && out.length > 1024-8))) message.channel.send('```js\n'+out+'```')
      else if (modifier = "-l") console.log(`${fn.time()} | Evaluation Result | ${out}`)
      else {
        console.log(`${fn.time()} | Evaluation Result | ${out}`)
        await message.channel.send(
          new Discord.MessageEmbed()
            .setColor("GREEN")
            .setTitle(`${fn.getEmoji(client, 'green_tick')} Evaluation Success!`)
            .addField(`Expression`, '```js\n'+args.join(" ")+'```')
            .addField(`Result`, '```js\nOutput too long. Check console log.```')
            .setFooter(client.user.username, client.user.avatarURL({ format: 'png', dynamic: true, size: 1024 }))
        ).catch(console.error)
      }
		} catch (e) {
      let emsg = `\`\`\`js\n${e.stack.replace(
        /(?:(?!\n.*?\(\/home\/utopium\/wwou.*?)\n.*?\(\/.*?\))+/g,
        "\n\t...")}\`\`\``
      var embed = new Discord.MessageEmbed()
        .setColor("RED")
        .setTitle(`${fn.getEmoji(client, "red_tick")} Evaluation Failed!`)
        .addField(`Expression`, "```js\n" + args.join(" ") + "```")
        .addField(
          `Error Message`,
          `${emsg.length > 1024 ? "See below" : e}`
        )
        .setFooter(
          client.user.username,
          client.user.avatarURL({ format: "png", dynamic: true, size: 1024 })
        )
      message.channel.send(embed).catch(console.error)
      if(emsg.length > 1024) message.channel.send(emsg)
		}
    
	}
}