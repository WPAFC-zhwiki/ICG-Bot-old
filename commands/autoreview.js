const Discord = require('discord.js')
    , moment = require('moment')
    , db = require("quick.db")
    , $ = require( "jquery" )( new ( require( "jsdom" ).JSDOM )().window )

const config = require(process.cwd() + '/util/config.js')
    , fn = require(process.cwd() + '/util/fn.js')
    , issuesData = require( process.cwd() + "/util/issues.js" )

module.exports = {
  name: "autoreview",
  usage: "autoreview",
  aliases: ["自動審閱","自动审阅"],
  description: "自動審閱頁面並找出可能存在的溫體",
  run: async ({dcBot, tgBot}, message, args, shared) => {
    if (!args.length) {
      if (shared.source == "d") return message.channel.send("請輸入頁面名稱！")
      if (shared.source == "t") return tgBot.sendMessage(message.chat.id, "請輸入頁面名稱！")
    }
    let title = args.join(" ")
    let page = new fn.mwbot.page( title )
    let text = await page.text();
    let templates = 0;
    text.replace( /{{([^{}]+?)}}/, function () {
      templates += 1;
    } );
    let html = await fn.mwbot.parseWikitext( text, {
      title: title,
      uselang: "zh-tw"
    } );
    let parseHTML = $( $.parseHTML( html ) ).children();
    let delval = {
		tags: [
			// 表格
			'table',
			'tbody',
			'td',
			'tr',
			'th',
			'pre',
			// 樣式
			'style',
			// 標題常常解析出一堆亂象
			'h1',
			'h2',
			'h3',
			'h4',
			'h5',
			'h6'
		],
		ids: [
			// 小作品標籤
			'stub',
			// 目錄
			'toc'
		],
		classes: [
			// NoteTA
			'noteTA',
			// 表格
			'infobox',
			'wikitable',
			'navbox',
			// &#60;syntaxhighlight&#62;
			'mw-highlight',
			// 圖片說明
			'thumb',
			// &#60;reference /&#62;
			'reflist',
			'references',
			'reference',
			// 不印出來的
			'noprint',
			// 消歧義
			'hatnote',
			'navigation-not-searchable',
			// 目錄
			'toc',
			// edit
			'mw-editsection'
		]
	};

	let $countHTML = $parseHTML.clone();

	$countHTML.find( function () {
    let selector = '';

	  delval.tags.forEach( function ( tag ) {
	    selector += selector === '' ? tag : `, ${ tag }`;
	  } );

	  delval.ids.forEach( function ( id ) {
	    selector += `, #${ id }`;
	  } );

	  delval.classes.forEach( function ( thisclass ) {
	    selector += `, .${ thisclass }`;
	  } );

	  return selector;
	}() ).remove();
      
    let countText = $countHTML.text().replace( /\n/g, '' );
    let $tds = $parseHTML.find( 'td' );
 
    let { issues, elements } = fn.issueChecker( text, html, {
      links: $parseHTML.find( "a" ).length,
      templates,
      countText,
      $tds
    } );

    let dMsg = new Discord.MessageEmbed()
          .setColor(issues && issues.length ? "RED" : "GREEN")
          .setTitle("自動審閱系統")
          .setDescription(
            `系統剛剛自動審閱了[${title}](https://zhwp.org/${encodeURI( title )
            })頁面，初步${
              issues && issues.length
                ? `發現可能存在以下問題：\n` +
                  `• ${issues.map(x => issuesData[x]).join("\n• ")}`
                : `沒有發現顯著的問題。`
            }`
          )
          .setTimestamp()
    let tMsg = "*自動審閱系統*\n" + 
      `系統剛剛自動審閱了[${title}](https://zhwp.org/${encodeURI( title )
      })頁面，初步${
        issues && issues.length
          ? `發現可能存在以下問題：\n` +
            `• ${issues.map(x => issuesData[x]).join("\n• ")}`
          : `沒有發現顯著的問題。`
      }`

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
  }
}
