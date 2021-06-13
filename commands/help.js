const Discord = require("discord.js"),
      moment = require("moment"),
      db = require("quick.db")

const fn = require(process.cwd() + '/util/fn.js')

module.exports = {
  name: "help",
  runDiscord: async (client, message, args) => {
    if(args[0] === "staff") return
    await message.channel.send(
      new Discord.MessageEmbed()
        .setTitle("Help Menu")
        .setColor(0x7289da)
        .setThumbnail(client.user.avatarURL())
    )
  }
}
