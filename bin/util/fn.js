/* eslint-disable no-unreachable */
const Discord = require( 'discord.js' )
	  , moment = require( 'moment' )
	  , fs = require( 'fs' )
	  , { mwn } = require( 'mwn' )
	  , { JSDOM } = require( 'jsdom' );

const db = require( 'quick.db' );
// , logs = new db.table("Logs")

const { defaultPrefix, embedColor } = require('./config')

let time = (date = moment()) => {
  return moment(date).utcOffset(8).format("YYYY/MM/DD HH:mm:ss")
}

let utcTime = (date = moment()) => {
  return moment(date).format("YYYY/MM/DD HH:mm:ss [GMT]")
}

let ago = (date = moment()) => {
  return moment(date).fromNow()
}

let embed = (client, content) => {
  if (content instanceof Object) {
    let { title, description } = content
    return new Discord.MessageEmbed()
      .setColor(embedColor)
      .setTitle(title)
      .setDescription(description)
      .setFooter(client.user.username, client.user.avatarURL)
      .setTimestamp()
  } else if (typeof content == "string") {
    return new Discord.MessageEmbed()
      .setColor(embedColor)
      .setDescription(content)
      .setFooter(client.user.username, client.user.avatarURL)
      .setTimestamp()
  } else {
    throw Error('Invalid content type.\nAccepts Object or String.')
  }
  return undefined
}

const deepClone = (object) => {
  return JSON.parse(JSON.stringify(object))
}

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const addLog = (logid, msg, {debugchannel, debugonly} = {debugchannel: false, debugonly: false}) => {
  return;
  if(typeof logid === "object" && !debugchannel) debugchannel = logid.debug
  if(typeof logid === "object") logid = logid.gameID
  if(typeof logid === "number") logid = logid.toString()
  if(!typeof logid === "string") throw new TypeError('First parameter must be a game object or log ID')
  if(!typeof msg === "string") msg = msg.toString()
  if(msg === "-divider-") msg = "=============================="
  if(msg === "-divider2-") msg = "------------------------------"
  msg = `${time()} | ` + msg
  msg = msg.replace(/\\/g,"")
  msg = msg.replace(/\n/g,`\n${time()} | `)
  if(!debugonly) {
    logs.push(logid, msg)
    if (logs.get(logid).length >= 50) writeLogs(logid)
  }
  if(debugchannel) debug(debugchannel, msg)
}

const writeLogs = (logid) => {
  return;
  if(typeof logid === "object") logid = logid.gameID
  if(typeof logid === "number") logid = logid.toString()
  if(!typeof logid === "string") throw new TypeError('First parameter must be a game object or log ID')
  if(!logid) return
  let fulllog = logs.get(logid)
  if(!fulllog) return false
  fs.appendFile(process.cwd() + '//logs/' + logid + ".log", fulllog.join("\n")+"\n", (err) => {
    if (err) console.error(err);
    logs.delete(logid)
  });
}

let error = (client, message, error) => {
  return new Discord.MessageEmbed()
    .setColor(embedColor)
    .setTitle(message)
    .setDescription(`${error}`)
    .setFooter(client.user.username, client.user.avatarURL)
    .setTimestamp()
}

let getUser = (client, data) => {
  if (data instanceof Discord.User) return data
  if (data instanceof Discord.GuildMember) return data.user
  if (data instanceof Discord.Message) return data.author
  if (typeof data == "string") return client.users.cache.find(user => user.id == data || user.tag.toLowerCase() == data.toLowerCase())
  // throw Error('Cannot find user.')
}

let getMember = (guild, data) => {
  if (data instanceof Discord.User) return guild.members.get(data.id)
  if (data instanceof Discord.GuildMember) return data
  if (data instanceof Discord.Message) return data.member
  if (typeof data == "string") return guild.members.cache.find(member => member.user.id == data || member.user.tag.toLowerCase() == data.toLowerCase())
  // throw Error('Cannot find member.')
}

let getRole = (guild, data) => {
  if (data instanceof Discord.Role) return data
  if (typeof data == "string") return guild.roles.cache.find(role => role.name.toLowerCase() == data.toLowerCase() || role.id == data || role.name.toLowerCase().startsWith(data.toLowerCase()))
  // throw Error('Cannot find role.')
}

let getEmoji = (client, name) => {
  return client.emojis.cache.find(emoji => emoji.name.toLowerCase() == name.toLowerCase().replace(/ /g, "_"))
}

const getBacklogInfo = async (mwbot) => {
  let list = await new mwbot.category('Category:正在等待審核的草稿').members()
  list = list.filter(x => x.title != "Category:正在等待审核的用户页草稿")
  let cnt = list.length
  let rawLvl = new JSDOM(await mwbot.parseTitle('Template:AFC_status/level'))
  let lvl = parseInt(rawLvl.window.document.querySelector(".mw-parser-output > p").textContent, 10)
  return {
    cnt,
    list,
    lvl
  }
}

module.exports = {
  time,
  utcTime,
  date: utcTime,
  ago,
  embed,
  error,
  getUser,
  getMember,
  getEmoji,
  getRole,
  // paginator,
  deepClone,
  clone: deepClone,
  sleep,
  wait: sleep,
  addLog,
  writeLogs,
  writeLog: writeLogs,
  getBacklogInfo,
};

(async () => {
	let optin = require( './credentials.json' );
	Object.assign( optin.mwn, {
		apiUrl: 'https://zh.wikipedia.org/w/api.php',
		defaultParams: {
			assert: 'user'
		}
	} );
	const mwbot = new mwn( optin.mwn );
	if ( optin.mwn.OAuthCredentials ) {
		mwbot.getTokensAndSiteInfo();
	} else {
		mwbot.login();
	}
	module.exports.mwbot = mwbot;
})()