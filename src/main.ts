import mudawanah, {
  IPlugin,
  IConfig as IConfigBase,
  IPost as IPostBase,
  IPage
} from 'mudawanah'
import * as iridium from 'iridium'

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

interface IPost extends IPostBase {
  pluginsData?: {
    dynamic?: connections.DBPostLocale
  }
}

const plugin: IPlugin = {
  initialize(config: IConfig) {
    let uri: string = config.plugins.dynamic.mongodb
    if (uri === undefined) {
      uri = process.env[config.plugins.dynamic.env]
    }
    config.plugins.dynamic.db = new connections.DB(uri)
  },

  post: async (post: IPost, config: IConfig, next: () => Promise<void>) => {
    await next()

    const db = config.plugins.dynamic.db
    await db.connect()

    if (post.pluginsData === undefined) {
      post.pluginsData = {}
    }
    const info = await db.posts.findOne(post.id)
    if (info != null) {
      post.pluginsData.dynamic = info.locales.find((val, idx, arr) => val.locale === post.locale)
    } else {
      post.pluginsData.dynamic = {
        locale: post.locale,
        commnets: [],
        dislike: 0,
        hit: 0,
        like: 0
      }
    }
  }
}

export = plugin

