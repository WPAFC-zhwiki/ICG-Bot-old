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
      tag: {
        // 表格
        table: true,
        tbody: true,
        td: true,
        tr: true,
        th: true,
        // pre: true,
        // 樣式
        style: true,
        // 標題常常解析出一堆亂象
        h1: true,
        h2: true,
        h3: true,
        h4: true,
        h5: true,
        h6: true
      },
      id: {
        // 小作品標籤
        stub: true,
        // 目錄
        toc: true
      },
      class: {
        // NoteTA
        noteTA: true,
        // 表格
        infobox: true,
        wikitable: true,
        navbox: true,
        // &#60;syntaxhighlight&#62;
        "mw-highlight": true,
        // 圖片說明
        thumb: true,
        // &#60;reference /&#62;
        reflist: true,
        reference: true,
        // 不印出來的
        noprint: true,
        // 消歧義
        hatnote: true,
        "navigation-not-searchable": true,
        // 目錄
        toc: true
      }
    };
    let i = 0, ele, countText = "";
    while ( parseHTML.length > i ) {
      ele = parseHTML.get( i );
      if ( !ele.tagName ) {
        continue;
      } else if (
        ele &&
        delval.tag[ ele.tagName.toString().toLowerCase() ] !== true &&
        delval.id[ ele.id ] !== true &&
        // 看不到的
        ele.style.display !== "none"
      ) {
        let t = $( ele ).text();
        var classes = 0;
        while ( ele.classList.length > classes ) {
          if ( delval.class[ ele.classList[ classes ] ] ) {
            t = "";
          }
          classes++;
        }
        countText += t;
      }
      i++;
    }
    let { issues, elements } = fn.issueChecker( text, html, {
      links: parseHTML.find( "a" ).length,
      templates,
      countText
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