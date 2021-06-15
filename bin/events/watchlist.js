const EventSource = require( "eventsource" )
    , RTRC = new EventSource( "https://stream.wikimedia.org/v2/stream/recentchange" )
    , { MessageEmbed: DiscordMessageEmbed } = require( "discord.js" )
    , $ = require( "jquery" )( new ( require( "jsdom" ).JSDOM )().window )

const { mwbot } = require('../util/fn.js')
    , autoprview = require('../modules/autoreview')
    , issuesData = require('../modules/issuedata.json')

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

module.exports = {
	name: 'watchlist',
	fire: async (send) => {
		RTRC.onmessage = async function (event) {
			const data = JSON.parse(event.data);
			if (
				data.wiki !== 'zhwiki' ||
				data.type !== 'categorize' ||
				data.title !== 'Category:正在等待審核的草稿'
			) {
				return;
			}

			console.log(data.user, data.comment);

			const title = data.comment.replace(/^\[\[:?([^[\]]+)\]\].*$/, '$1');

			// if (status == "removed") return; // 稍後處理
			let { user } = data;

      let issues = []
        , reasons = []
      
      let mode

			let page = new mwbot.page(title);
			// console.log(page)
			let creator = await page.getCreator();
			await page.purge();
			let output = `[${user}](https://zhwp.org/User:${encodeURI(user)})`;

			let wikitext = await page.text();
			let html = await mwbot.parseWikitext(wikitext, {
				title: title,
				uselang: 'zh-tw'
			});
			let $parseHTML = $($.parseHTML(html));
			let $submissionbox = $parseHTML.find('.afc-submission-pending').length 
				? $parseHTML.find('.afc-submission-pending').first()
			  : $parseHTML.find('.afc-submission').first();
			if (!$submissionbox.length && page.namespace === 0) {
        mode = "accept"
				output += `已接受[${creator}](https://zhwp.org/User:${encodeURI(creator)})的草稿[${title}](https://zhwp.org/${encodeURI(title)})`;
				let tpClass;
				try {
					let talkPage = await mwbot.read(page.getTalkPage());
					tpClass = talkPage.revisions[0].content.match(/\|class=([^|]*?)\|/)[1];
				} catch (e) {
					tpClass = '';
				}
				let cClass;
				switch (tpClass) {
					case 'B':
						cClass = '乙';
						break;
					case 'C':
						cClass = '丙';
						break;
					case 'start':
						cClass = '初';
						break;
					case 'stub':
						cClass = '小作品';
						break;
					case 'list':
						cClass = '列表';
						break;
				}
				if (cClass) output += `並評為${cClass}級。`;
        else output += `，未評級。`
			} else if (!$submissionbox.length && page.namespace !== 0) {
        mode = "remove"
				output += `移除了[${creator}](https://zhwp.org/User:${encodeURI(creator)})的草稿[${title}](https://zhwp.org/${encodeURI(title)})的AFC模板。`;
			} else if ($submissionbox.hasClass('afc-submission-pending')) {
        mode = "submit"
				output += '提交了';
				if (creator !== user) {
					output += `[${creator}](https://zhwp.org/User:${encodeURI(creator)})創建的`;
				}
				output += `草稿[${title}](https://zhwp.org/${encodeURI(title)})。`;

				issues = await autoprview(wikitext, $parseHTML).issues
			} else if (
        $submissionbox.hasClass('afc-submission-declined') ||
        $submissionbox.hasClass('afc-submission-rejected')
      ) {
				output += '將';
				if (wikitext.match(/\|u=([^|]+)\|/)) {
					let submituser = wikitext.match(/\|u=([^|]+)\|/)[1];
					output += `提交者[${submituser}](https://zhwp.org/User:${encodeURI(submituser)})所提交的`;
				} else {
					output += `建立者[${creator}](https://zhwp.org/User:${encodeURI(creator)})的`;
				}
				output += `草稿[${title}](https://zhwp.org/${encodeURI(title)})標記為`;
				if ($submissionbox.hasClass('afc-submission-rejected')) {
          mode = "reject"
					output += '拒絕再次提交的草稿';
				} else {
          mode = "decline"
					output += '仍需改善的草稿';
				}
				let $reasonbox = $submissionbox.find('.afc-submission-reason-box');
				if ($reasonbox.children().length) {
					$reasonbox.children().each(function (_i, $e) {
						if ($($e).children().length > 1 && $($e).children() === $($e).children('table, hr').length) {
							$($e).children().each(function (_ei, $ee) {
								let res = getReason($($ee));
								if (res.length > 0) {
									reasons.push(getReason($($ee)));
								}
							});
						} else {
							reasons.push(getReason($($e)));
						}
					});
				}
			}

			if (output === `[${user}](https://zhwp.org/User:${encodeURI(user)})`) {
				return;
			}

			let dMsg = new DiscordMessageEmbed().setDescription(`**${output}**`);
			let tMsg = output;
      if (issues && issues.length) {
        dMsg.addField(
          "自動檢測問題",
          `• ${issues.map(x => `${issuesData[x]} (${x})`).join('\n• ')}`
        )
        tMsg += '\n\n*自動檢測問題*\n• ' + issues.map((x) => `${issuesData[x]} (${x})`).join('\n• ')
      }
      if (mode == "decline" || mode == "reject") {
        dMsg.addField(
          "拒絕理由",
          reasons.length 
            ? `• ${reasons.map(v => `${v.trim()}`).join('\n• ')}` 
            : "未提供拒絕理由。"
        )
        tMsg += (
          reasons.length
            ? `，理由如下：\n• ${reasons.map(v => `${v.trim()}`).join('\n• ')}` 
            : "，未提供拒絕理由。"
        )
      }
			send({
				dMsg,
				tMsg
			});
		};
	}
};
