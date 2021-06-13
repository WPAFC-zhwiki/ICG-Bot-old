const Discord = require("discord.js")
    , moment = require("moment")
    , db = require("quick.db")
    , fn = require(process.cwd() + '/util/fn.js')
    , config = require(process.cwd() + '/util/config.js')

module.exports = (dcBot, tgBot) => {
  dcBot.on('message', async message => {
  
    if (message.author.bot) return;
    
    const msg = message.content.trim().toLowerCase()
    
    const prefix = config.defaultPrefix
    
    let shared = {}
      
    if (msg.startsWith(prefix)) {
      
      let args = message.content.trim().slice(prefix.length).split(/\s+/u)
      shared.prefix = prefix
      
      const commandName = args.shift().toLowerCase()
      shared.commandName = commandName
      const command = dcBot.commands.get(commandName) || dcBot.commands.find((cmd) => cmd.aliases && cmd.aliases.includes(commandName))
  
      if (!command) return;

/** Blacklist function disabled
      if (players.get(`${message.author.id}.banned`) && !['help','role','ping'].includes(commandName)) {
        let {reason, until} = players.get(`${message.author.id}.banned`)
        return await message.author.send(
          new Discord.MessageEmbed()
            .setColor("RED")
            .setTitle("You have been blacklisted from ---!")
            .setDescription(
              `**Reason**: ${reason}\n` +
              `**Ban expires**: ${fn.utcTime(until)}`
            )
            .setFooter(`If you think you are incorrectly blacklisted, please contact --- moderators.`)
        )
      }
*/   
      // setTimeout(() => message.delete().catch(()=>{}), 60000)

      try {
        await command.runDiscord(dcBot, message, args, shared)
      } catch (error) {
        console.error(error)
      }
    }
  })

  tgBot.on('message', async message => {
    // console.log(message)
    const msg = (message.text || "").trim().toLowerCase()
    
    const prefix = config.defaultPrefix
    
    let shared = {}
      
    if (msg.startsWith(prefix)) {
      
      let args = message.text.trim().slice(prefix.length).split(/\s+/u)
      shared.prefix = prefix
      
      const commandName = args.shift().toLowerCase().replace("@zhwpafc_helperbot","")
      shared.commandName = commandName
      const command = tgBot.commands.get(commandName) || tgBot.commands.find((cmd) => cmd.aliases && cmd.aliases.includes(commandName))
  
      if (!command) return;
      // setTimeout(() => message.delete().catch(()=>{}), 60000)

      try {
        await command.runTelegram(tgBot, message, args, shared)
      } catch (error) {
        console.error(error)
      }
    }
  })
}
