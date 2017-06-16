import * as iridium from 'iridium'
import * as path from 'path'
import * as fs from 'fs'
import * as yml from 'js-yaml'
import * as hljs from 'highlight.js'
import * as mdit from 'markdown-it'
import * as rmMD from 'remove-markdown'

import { root } from './helpers'
import * as types from './declarations'
import * as connections from './connections'

import Config from './config'

export default function (dataDir: string) {

  const config = Config(dataDir).global

  const db = new connections.DB(config.mongo.url)

  const md = mdit('commonmark', {
    highlight: (str, lang) => {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(lang, str).value
        } catch (_) { }
      }
      return ''
    }
  })

  const postFiles = fs.readdirSync(root('data', 'posts'))

  const postsMap: { [url: string]: string } = {}
  let posts: { [fullId: string]: types.PostMetadata } = {}
  let postByLocale: { [locale: string]: string[] } = {}

  let tempPosts: types.PostMetadata[] = []

  for (let post of postFiles) {
    let postData = fs.readFileSync(root('data', 'posts', post), 'utf8').split('\n\n\n')
    let meta: types.PostMetadata = yml.safeLoad(postData[0])

    fs.writeFileSync(root('_temp', 'posts', `${meta.id}.${meta.locale}.html`),
      md.render(postData[1]), 'utf8')

    meta.view = rmMD(postData[1], { gfm: true })

    tempPosts.push(meta)
  }

  tempPosts.sort((a, b) => new Date(b.date).valueOf() - new Date(a.date).valueOf())

  for (let meta of tempPosts) {
    postsMap[meta.url] = `${meta.id}.${meta.locale}`

    posts[`${meta.id}.${meta.locale}`] = meta

    if (postByLocale[meta.locale] == undefined)
      postByLocale[meta.locale] = []
    postByLocale[meta.locale].push(meta.id);
  }

  function getMetaPostsByLocale(locale: string) {
    let handles = postByLocale[locale]
    let ret: types.PostMetadata[] = []

    for (let handle of handles)
      ret.push(posts[handle])

    return ret
  }

  async function getPost(id: string) {
    await db.connect()
    const post = await db.posts.findOne(id)
    if (post == null)
      throw new Error(`Post '${id}' does not exist.`)
    await db.close()
    return post
  }

  async function getPostDetails(id: string, locale?: string) {
    if (locale == undefined) {
      const split = id.split('.')
      id = split[0]
      locale = split[1]
    }
    const post = await getPost(id)
    const details = post.locales.find((e, i, arr) => e.locale === locale)
    if (details === undefined)
      throw new Error(`Locale ${locale} does not exist on post '${id}'.`)
    return details
  }

  async function getComments(id: string, locale?: string) {
    const details = await getPostDetails(id, locale)
    return details.commnets
  }
}
