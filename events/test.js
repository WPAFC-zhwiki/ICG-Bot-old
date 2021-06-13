const Discord = require("discord.js")
    , moment = require("moment")
    , db = require("quick.db")
    , EventSource = require('eventsource')

const fn = require(process.cwd() + '/util/fn.js')
    , config = require(process.cwd() + '/util/config.js')

const RTRC = new EventSource( "https://stream.wikimedia.org/v2/stream/recentchange" )

const TGREVGRP = -1001391997174
    , DCREVCHN = "852564292393238558"
    , IRCCHN = "#wikipedia-zh-afc-reviewer"

module.exports = async (dcBot, tgBot) => {
  return;
  await fn.wait(1000)
  let page = new fn.mwbot.page("User:LuciferianThomas/AFC測試")
  // console.log(page)
  // let creator = await page.getCreator();
  // let output = `[${ user }](https://zhwp.org/User:${ encodeURI( user ) })`;
  let text = await page.text();
  let html = await fn.mwbot.parseWikitext( text, {
    title: page.title,
    uselang: "zh-tw"
  } );
  console.log(html)
}

/*
{
  '$schema': '/mediawiki/recentchange/1.0.0',
  meta: {
    uri: 'https://zh.wikipedia.org/wiki/Category:%E6%9C%89%E8%93%9D%E9%93%BE%E5%8D%B4%E6%9C%AA%E7%A7%BB%E9%99%A4%E5%86%85%E9%83%A8%E9%93%BE%E6%8E%A5%E5%8A%A9%E6%89%8B%E6%A8%A1%E6%9D%BF%E7%9A%84%E9%A1%B5%E9%9D%A2',
    request_id: 'd841afdc-1440-43fa-8d21-b8ecce813ce9',
    id: '2778cf5e-7fb2-4b01-8962-0983f9ee8799',
    dt: '2021-06-12T11:14:43Z',
    domain: 'zh.wikipedia.org',
    stream: 'mediawiki.recentchange',
    topic: 'eqiad.mediawiki.recentchange',
    partition: 0,
    offset: 3258956494
  },
  id: 135311783,
  type: 'categorize',
  namespace: 14,
  title: 'Category:有蓝链却未移除内部链接助手模板的页面',
  comment: '[[:大西洋党]]已从分类中移除',
  timestamp: 1623496483,
  user: 'Cewbot',
  bot: true,
  server_url: 'https://zh.wikipedia.org',
  server_name: 'zh.wikipedia.org',
  server_script_path: '/w',
  wiki: 'zhwiki',
  parsedcomment: '<a href="/wiki/%E5%A4%A7%E8%A5%BF%E6%B4%8B%E5%85%9A" title="大西洋党">大西洋党</a>已从分类中移除'
}
*/