const EventSource = require( "eventsource" )
    , RTRC = new EventSource( "https://stream.wikimedia.org/v2/stream/recentchange" )
    , { MessageEmbed: DiscordMessageEmbed } = require( "discord.js" )
    , $ = require( "jquery" )( new ( require( "jsdom" ).JSDOM )().window )

const TGREVGRP = -1001391997174
    , DCREVCHN = "852564292393238558"
    , IRCCHN = "#wikipedia-zh-afc-reviewer"

const fn = require( process.cwd() + "/util/fn.js" )
    , issuesData = require( process.cwd() + "/util/issues.js" )

const getReason = ($e = $("<div>")) => {
  if ($e.find("table").length) {
    $e.find(".hide-when-compact, .date-container").remove()
  }
  let text = $e.text().trim()
  if ($e.find("a")) {
    $e.find("a").each(function (_i, ele) {
      text = text.replace(
        $(ele).text(),
        `[${$(ele).text()}](${ele.href.replace(/^\/w/, "https://zhwp.org/w")} )`
      )
    })
  }
  text = text.split("。")[0] + "。"

  if (text === "。") {
    return ""
  }

  return text.replace(/此條目/g, "草稿").replace(/\n/g, "")
}

/**
 * @param {import("discord.js").Client} dcBot
 * @param {import("telegraf").Telegraf} tgBot
 */
module.exports = async ( dcBot, tgBot ) => {
  RTRC.onmessage = async ( event ) => {
    const data = JSON.parse( event.data );
    if (
      data.wiki !== "zhwiki" ||
      data.type !== "categorize" ||
      data.title !== "Category:正在等待審核的草稿"
    ) {
      return;
    }

    console.log( data.user, data.comment );

    let status =
      data.comment.match( /^\[\[([^[\]]+)\]\]已添加至分类/ ) && "add" ||
      data.comment.match( /^\[\[([^[\]]+)\]\]已从分类中移除/ ) && "remove" ||
      // It may be an error
      undefined;

    if ( !status ) {
      return;
    }

    console.log( `status: ${ status }` );

    const title = data.comment.replace( /^\[\[:?([^[\]]+)\]\].*$/, "$1" );

    // if (status == "removed") return; // 稍後處理
    let { user } = data;

    let page = new fn.mwbot.page( title );
    // console.log(page)
    let creator = await page.getCreator();
    await page.purge();
    let output = `[${ user }](https://zhwp.org/User:${ encodeURI( user ) })`;
    let issues = []
    if ( status === "remove" ) {
      let text = await page.text();
      let html = await fn.mwbot.parseWikitext( text, {
        title: title,
        uselang: "zh-tw"
      } );
      let parseHTML = $( $.parseHTML( html ) );
      let $submissionbox = parseHTML.find( ".afc-submission" ).first();
      if ( !$submissionbox.length && page.namespace === 0 ) {
        output += `已接受[${ creator }](https://zhwp.org/User:${ encodeURI( creator ) })的草稿[${title}](https://zhwp.org/${ encodeURI( title ) })`;
        let tpClass;
        try {
          let talkPage = await fn.mwbot.read( page.getTalkPage() );
          tpClass = talkPage.revisions[ 0 ].content.match( /\|class=([^|]*?)\|/ )[ 1 ];
        } catch ( e ) {
          tpClass = "";
        }
        let cClass = "";
        switch ( tpClass ) {
          case "B":
            cClass = "乙";
            break;
          case "C":
            cClass = "丙";
            break;
          case "start":
            cClass = "初";
            break;
          case "stub":
            cClass = "小作品";
            break;
          case "list":
            cClass = "列表";
            break;
        }
        if ( cClass.length > 0 ) {
          output += `（${ cClass }級）`;
        }
      } else if ( !$submissionbox.length && page.namespace !== 0 ) {
        output += `移除了[${ creator }](https://zhwp.org/User:${ encodeURI( creator ) })的草稿[${ title }](https://zhwp.org/${ encodeURI( title ) })的AFC模板。`;
      } else if ( $submissionbox.hasClass( "afc-submission-pending" ) ) {
        console.log( "Bug: The page has {{Afc submission/pending}} is removed from category \"Category:正在等待審核的草稿\"? hm......" );
        return;
      } else if ( $submissionbox.hasClass( "afc-submission-declined" ) || $submissionbox.hasClass( "afc-submission-rejected" ) ) {
        output += "將";
        if ( text.match( /\|u=([^|]+)\|/ ) ) {
          let submituser = text.match( /\|u=([^|]+)\|/ )[ 1 ];
          output += `提交者[${ submituser }](https://zhwp.org/User:${ encodeURI( submituser ) })所提交的`;
        } else {
          output += `建立者[${ creator }](https://zhwp.org/User:${ encodeURI( creator ) })的`;
        }
        output += `草稿[${ title }](https://zhwp.org/${ encodeURI( title ) })標記為`;
        if ( $submissionbox.hasClass( "afc-submission-rejected" ) ) {
          output += "拒絕再次提交的草稿";
        } else {
          output += "仍需改善的草稿";
        }
        let reason = "，未提供理由。",
          $reasonbox = $submissionbox.find( ".afc-submission-reason-box" );
        if ( $reasonbox.children().length ) {
          reason = "，理由：";
          let reasons = [];
          $reasonbox.children().each( function ( _i, $e ) {
            if ( $( $e ).children().length > 1 && $( $e ).children() === $( $e ).children( "table, hr" ).length ) {
              $( $e ).children().each( function ( _ei, $ee ) {
                let res = getReason( $( $ee ) );
                if ( res.length > 0 ) {
                  reasons.push( getReason( $( $ee ) ) );
                }
              } );
            } else {
              reasons.push( getReason( $( $e ) ) );
            }
          } );
          reasons.forEach( function ( v, i ) {
            reason += `\n*${ i + 1 }*：${ v.trim() }`;
          } );
        }
        output += reason;
      }
    } else if ( status === "add" ) {
      output += "提交了";
      if ( creator !== user ) {
        output += `[${ creator }](https://zhwp.org/User:${ encodeURI( creator ) })創建的`;
      }
      output += `草稿[${title}](https://zhwp.org/${ encodeURI( title ) })`;
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
      let issueChecker = fn.onSubmit( output, text, {
        links: parseHTML.find( "a" ).length,
        templates,
        countText
      } );
      let elements = issueChecker.elements
      issues = issueChecker.issues
      // output += "\n\n*可能存在的問題*" + issues.join(" ")
    }

    if ( output === `[${ user }](https://zhwp.org/User:${ encodeURI( user ) })` ) {
      return;
    }

    console.log( `${output}${issues && issues.length ? `\n*自動檢測問題*\n${issues.map(x => issuesData[x]).join(" ")}` : ""}` );

    let embed = new DiscordMessageEmbed()
      .setDescription( `**${ output }**` )
    if (issues && issues.length)
      embed.addField("自動檢測問題", `• ${issues.map(x => issuesData[x]).join("\n• ")}`)
    dcBot.channels.cache.get( DCREVCHN ).send(embed);

    tgBot.sendMessage( TGREVGRP, `${output}${issues && issues.length ? `\n\n*自動檢測問題*\n• ${issues.map(x => issuesData[x]).join("\n• ")}` : ""}`, {
      // eslint-disable-next-line camelcase
      parse_mode: "Markdown",
      // eslint-disable-next-line camelcase
      disable_web_page_preview: true
    } );
  };
};
