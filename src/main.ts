import mudawanah, {
  IPlugin,
  IConfig as IConfigBase,
  IPost as IPostBase,
  IPage
} from 'mudawanah'
import * as route from 'koa-router'
import * as bodyparse from 'koa-bodyparser'
import * as fs from 'fs'
import * as gravatar from 'gravatar'

import * as connections from './connections'

interface IConfig extends IConfigBase {
  plugins: {
    dynamic: {
      mongodb: string
      env: string
      db: connections.DB
    }
  }
}

interface IPostLocale extends connections.DBPostLocale {
  comments: (connections.DBComment & { gravatar?: string })[]
}

interface IPost extends IPostBase {
  pluginsData?: {
    dynamic?: IPostLocale & {
      injectionScript?: string
    }
  }
}

const injectionTemp1 = fs.readFileSync('clientHelper', 'utf8')
  .split('POST_ID__WILL_BE_REPLACED')
const injectionTemp2 = injectionTemp1[1].split('POST_LOCALE__WILL_BE_REPLACED')
function inject(post: IPost) {
  return injectionTemp1[0] + post.id + injectionTemp2[0] + post.locale + injectionTemp2[1]
}

const plugin: IPlugin = {
  async initialize(blog: { routes: route, config: IConfig, posts: IPost[] }) {
    let uri: string = blog.config.plugins.dynamic.mongodb
    if (uri === undefined) {
      uri = process.env[blog.config.plugins.dynamic.env]
    }

    const db = new connections.DB(uri)
    blog.config.plugins.dynamic.db = db

    // Ensure db
    await db.connect()
    for (const post of blog.posts) {
      const postI = await db.posts.findOne(post.id)
      if (postI === null) {
        await db.posts.insert({
          _id: post.id,
          locales: [{
            locale: post.locale,
            comments: [],
            likedBy: [],
            dislikedBy: [],
            like: 0, dislike: 0, hit: 0
          }]
        })
      } else if (postI.locales.findIndex(o => o.locale === post.locale) === -1) {
        postI.locales.push({
          locale: post.locale,
          comments: [],
          likedBy: [],
          dislikedBy: [],
          like: 0, dislike: 0, hit: 0
        })
        await db.posts.insert(postI)
      }
    }
    await db.close()

    blog.routes.use(bodyparse())

    blog.routes.get('/assets/mudawanah-dynamic-helper.js', async (ctx, next) => {
      await next()
      ctx.type = 'js'
      ctx.body = fs.createReadStream('clientHelper.js', 'utf8')
    })

    blog.routes.get('/dxapi', async (ctx, next) => {
      await next()
      await db.connect()
      const id = ctx.request.body.id
      const meta = await db.posts.findOne(id[0]) as connections.DBPost
      const loc = meta.locales.find(o => o.locale === ctx.request.body.locale)
      if (loc !== undefined) {
        ctx.body = { likes: loc.like, dislikes: loc.dislike }
      }
      await db.close()
    })

    blog.routes.post('/dxapi', async (ctx, next) => {
      await next()
      await db.connect()
      const id = ctx.request.body.id
      const meta = await db.posts.findOne(id[0]) as connections.DBPost
      const idx = meta.locales.findIndex(o => o.locale === ctx.request.body.locale)
      if (idx !== -1) {
        const loc = meta.locales[idx]
        // Like
        if (ctx.request.body.like !== undefined) {
          const liked = loc.likedBy.findIndex(o => o === ctx.request.body.like)
          if (liked === -1) {
            loc.like++
            loc.likedBy.push(ctx.request.body.like)
          } else {
            loc.like--
            loc.likedBy.splice(liked, 1)
          }
          ctx.body = { likes: loc.like }
        }
        // Dislike
        if (ctx.request.body.dislike !== undefined) {
          const disliked = loc.dislikedBy.findIndex(o => o === ctx.request.body.dislike)
          if (disliked === -1) {
            loc.dislike++
            loc.dislikedBy.push(ctx.request.body.dislike)
          } else {
            loc.dislike--
            loc.dislikedBy.splice(disliked, 1)
          }
          ctx.body = { dislikes: loc.dislike }
        }
        // Comment
        if (ctx.request.body.comment !== undefined) {
          loc.comments.push(ctx.request.body.comment)
        }
        ctx.body = { likes: loc.like, dislikes: loc.dislike }
        meta.locales[idx] = loc
        db.posts.insert(meta)
      }
      await db.close()
    })
  },

  post: async (post: IPost, config: IConfig, next: () => Promise<void>) => {
    await next()

    const db = config.plugins.dynamic.db
    await db.connect()

    if (post.pluginsData === undefined) {
      post.pluginsData = {}
    }
    const info = await db.posts.findOne(post.id) as connections.DBPost
    post.pluginsData.dynamic = info.locales.find(o => o.locale === post.locale) as connections.DBPostLocale
    post.pluginsData.dynamic.injectionScript = inject(post)
    for (const comment of post.pluginsData.dynamic.comments) {
      comment.gravatar = gravatar.url(comment.email, { default: 'retro' }, false)
    }
  }
}

export = plugin
