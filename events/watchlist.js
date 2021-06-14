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
  // console.log("Start ident a reason:", new Date())
  if ($e.find("table").length) {
    $e.find(".hide-when-compact, .date-container").remove()
  }
  console.log($e.find(".mbox-image a"))
  if ($e.find(".mbox-image a").length) {
    $e.find(".mbox-image a").remove()
  }
  let text = $e.text().trim()
  let li = $e.find("li")
    , hr = $e.find("hr")
    , a = $e.find("a")
  if (li) {
    li.each((_i, ele) => {
      let eleText = $(ele).text()
      text = text.replace(
        eleText,
        `${eleText}\r• `
      )
    })
  }
  if (a) {
    a.each((_i, ele) => {
      let eleText = $(ele).text()
      text = text.replace(
        eleText,
        `[${eleText}](${ele.href.replace(/^\/w/, "https://zhwp.org/w")} )`
      )
    })
  }
  text = text.split("。")[0] + "。"

  if (text === "。") {
    return ""
  }
  // console.log("Done identing reason:", new Date())
  return text.replace(/此條目/g, "草稿").replace(/\n/g, "").replace(/\r/g,"\n").replace(/\n• (?:$|\n)/g,"")
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
    // console.log("Received event:", new Date())

    let status =
      data.comment.match( /^\[\[([^[\]]+)\]\]已添加至分类/ ) && "add" ||
      data.comment.match( /^\[\[([^[\]]+)\]\]已从分类中移除/ ) && "remove" ||
      // It may be an error
      undefined;

    if ( !status ) {
      return;
    }
    // console.log("Identified status:", new Date())

    console.log( `status: ${ status }` );

    const title = data.comment.replace( /^\[\[:?([^[\]]+)\]\].*$/, "$1" );

    let { user } = data;

    let page = new fn.mwbot.page( title );
    // console.log(page)
    let creator = await page.getCreator();
    await page.purge();
    let output = `[${ user }](https://zhwp.org/User:${ encodeURI( user ) })`;

    let reasonL = []
      , issues = []
      , mode = ""

    // console.log("Obtained page information:", new Date())
    if ( status === "remove" ) {
      let text = await page.text();
      let html = await fn.mwbot.parseWikitext( text, {
        title: title,
        uselang: "zh-tw"
      } );
      // console.log("Obtained page text & wikitext for remove template edit:", new Date())
      let parseHTML = $( $.parseHTML( html ) );
      let $submissionbox = parseHTML.find( ".afc-submission" ).first();
      if ( !$submissionbox.length && page.namespace === 0 ) {
        mode = "accept"
        // console.log("Identified as accept:", new Date())
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
        // console.log("Identified accept class:", new Date())
      } 
      else if ( !$submissionbox.length && page.namespace !== 0 ) {
        mode = "remove"
        // console.log("Identified as template removal:", new Date())
        output += `移除了[${ creator }](https://zhwp.org/User:${ encodeURI( creator ) })的草稿[${ title }](https://zhwp.org/${ encodeURI( title ) })的AFC模板。`;
      } 
      else if ( $submissionbox.hasClass( "afc-submission-pending" ) ) {
        console.log( "Bug: The page has {{Afc submission/pending}} is removed from category \"Category:正在等待審核的草稿\"? hm......" );
        return;
      } 
      else if ( 
        $submissionbox.hasClass( "afc-submission-declined" ) || 
        $submissionbox.hasClass( "afc-submission-rejected" ) 
      ) {
        // console.log("Identified as reject/decline:", new Date())
        output += "將";
        if ( text.match( /\|u=([^|]+)\|/ ) ) {
          let submituser = text.match( /\|u=([^|]+)\|/ )[ 1 ];
          output += `提交者[${ submituser }](https://zhwp.org/User:${ encodeURI( submituser ) })所提交的`;
        } else {
          output += `建立者[${ creator }](https://zhwp.org/User:${ encodeURI( creator ) })的`;
        }
        // console.log("Identified submitter/creator:", new Date())
        output += `草稿[${ title }](https://zhwp.org/${ encodeURI( title ) })標記為`;
        if ( $submissionbox.hasClass( "afc-submission-rejected" ) ) {
          output += "拒絕再次提交的草稿";
          mode = "reject"
        } else {
          output += "仍需改善的草稿";
          mode = "decline"
        }
        // console.log("Marked as rejected/declined:", new Date())
        let $reasonbox = $submissionbox.find( ".afc-submission-reason-box" );
        if ( $reasonbox.children().length ) {
          // console.log("Start of reason module:", new Date())
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
            reasonL.push(`• ${ v.trim() }`);
          } );
          // console.log("End of reason module:", new Date())
        }
        // output += reason;
        // console.log(`Obtained reason`, new Date(),`\n${reason}`)
      }
    } else if ( status === "add" ) {
      // console.log("Identified as submission:", new Date())
      mode = "submit"
      output += "提交了";
      if ( creator !== user ) {
        output += `[${ creator }](https://zhwp.org/User:${ encodeURI( creator ) })創建的`;
      }
      output += `草稿[${title}](https://zhwp.org/${ encodeURI( title ) })`;
      // console.log("Identified submitter:", new Date())
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

      let $countHTML = parseHTML.clone();

      $countHTML.find(function () {
        let selector = '';

        delval.tags.forEach(function (tag) {
          selector += selector === '' ? tag : `, ${tag}`;
        });

        delval.ids.forEach(function (id) {
          selector += `, #${id}`;
        });

        delval.classes.forEach(function (thisclass) {
          selector += `, .${thisclass}`;
        });

        return selector;
      }()).remove();

      let countText = $countHTML.text().replace(/\n/g, '');
      let $tds = parseHTML.find('td');

      let issueChecker = fn.issueChecker(text, html, {
        links: parseHTML.find("a").length,
        templates,
        countText,
        $tds
      });
      isses = issueChecker.issues
      // console.log("Done issue checking:", new Date())
      // output += "\n\n*可能存在的問題*" + issues.join(" ")
    }

    if ( output === `[${ user }](https://zhwp.org/User:${ encodeURI( user ) })` ) {
      return;
    }

    // console.log( `${output}${issues && issues.length
    //   ? `\n*自動檢測問題*\n${issues.map(x => issuesData[x]).join(" ")}`
    //   : ""}` );

    let embed = new DiscordMessageEmbed()
      .setDescription( `**${ output }**` )
    if (mode == "reject" || mode == "decline")
      embed.addField("拒絕理由：", reasonL.length ? reasonL.join("\n") : "無")
    if (issues && issues.length)
      embed.addField("自動檢測問題", `• ${issues.map(x => issuesData[x]).join("\n• ")}`)
    dcBot.channels.cache.get( DCREVCHN ).send(embed);

    let tMsg = output
    if (mode == "reject" || mode == "decline") {
      if (reasonL.length) tMsg += `，理由如下：\n${reasonL.join("\n")}`
      else tMsg += "，未提供理由。"
    }
    if (issues && issues.length) tMsg += `\n\n*自動檢測問題*\n• ${issues.map(x => issuesData[x]).join("\n• ")}`
    console.log(tMsg)
    tMsg = tMsg.replace(/_/g, "\\_")

    tgBot.sendMessage( TGREVGRP, tMsg, {
      // eslint-disable-next-line camelcase
      parse_mode: "Markdown",
      // eslint-disable-next-line camelcase
      disable_web_page_preview: true
    } );
    
    // console.log("Done with everything:", new Date())
  };
};
