import { Collection, Instance, Model, Core, ObjectID, Property } from 'iridium'

export interface DBComment {
  email: string
  body: string
  name?: string
  time: Date

  like: number
  dislike: number
  likedBy: string[]
  dislikedBy: string[]
}

export interface DBPostLocale {
  locale: string
  hit: number
  like: number
  dislike: number
  likedBy: string[]
  dislikedBy: string[]
  comments: DBComment[]
}

export interface DBPost {
  _id: string
  locales: DBPostLocale[]
}

@Collection('posts')
export class PostsInstance extends Instance<DBPost, PostsInstance> implements DBPost {
  @Property(String) _id: string

  @Property([{
    locale: String,
    hit: Number,
    like: Number,
    dislike: Number,
    likedBy: [String],
    dislikedBy: [String],
    commnets: [{
      email: String,
      body: String,
      name: String,
      time: Date,
      like: Number,
      dislike: Number,
      likedBy: [String],
      dislikedBy: [String]
    }]
  }])
  locales: DBPostLocale[]
}

export class DB extends Core {
  posts = new Model<DBPost, PostsInstance>(this, PostsInstance)
}
