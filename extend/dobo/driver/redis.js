import { createClient } from 'redis'
import queryBuilder from '../../../lib/query-builder.js'

async function redisDriverFactory () {
  const { Driver } = this.app.dobo.baseClass
  const { isEmpty, omit, merge } = this.app.lib._

  class RedisDriver extends Driver {
    constructor (plugin, options) {
      super(plugin)
      this.idField.name = 'id'
      this.support.propType.datetime = false
    }

    async sanitizeConnection (item) {
      await super.sanitizeConnection(item)
      item.port = item.port ?? 6379
      item.host = item.host ?? '127.0.0.1'
      item.database = item.database ?? '0'
    }

    _getIndexName (model) {
      return `${model.plugin.ns}:idx:${model.name}`
    }

    _getPrefixName (model) {
      return `${model.plugin.ns}:${model.name}`
    }

    async createClient (connection) {
      const { host, port, user, password, database } = connection.options
      const url = new URL(`redis://${host}:${port}/${database}`)
      if (user) {
        url.username = user
        url.password = password ?? ''
      }
      connection.client = await createClient({ url })
      connection.client.connect()
    }

    async modelExists (model, options = {}) {
      const name = this._getIndexName(model)
      const indexes = await model.connection.client.ft._list()
      return { data: indexes.includes(name) }
    }

    async buildModel (model, options = {}) {
      const name = this._getIndexName(model)
      const body = { id: { type: 'TEXT', sortable: true } }
      for (const index of model.indexes) {
        for (const field of index.fields) {
          const sortable = model.sortables.includes(field)
          const prop = model.properties.find(p => p.name === field)
          let type = 'TEXT'
          if (['float', 'double', 'integer', 'smallint'].includes(prop.type)) type = 'NUMERIC'
          body[prop.name] = { sortable, type }
        }
      }
      if (isEmpty(body)) return
      const opts = { ON: 'HASH', PREFIX: this._getPrefixName(model) }
      await model.connection.client.ft.create(name, body, opts)
      return { data: true }
    }

    async dropModel (model, options = {}) {
      const name = this._getIndexName(model)
      await this.clearRecord(model, options)
      await model.connection.client.ft.dropIndex(name)
      return { data: true }
    }

    async createRecord (model, body = {}, options = {}) {
      const prefix = this._getPrefixName(model)
      const key = `${prefix}:${body.id}`
      try {
        await this.getRecord(model, body.id)
        throw new Error('exists')
      } catch (err) {
        if (err.message === 'exists') throw this.plugin.error('recordExists%s%s', body.id, model.name)
      }
      await model.connection.client.hSet(key, body)
      if (options.noResult) return
      const result = await this.getRecord(model, body.id)
      return result
    }

    async getRecord (model, id, options = {}) {
      const prefix = this._getPrefixName(model)
      const key = `${prefix}:${id}`
      const result = await model.connection.client.hGetAll(key)
      if (isEmpty(result)) throw this.plugin.error('recordNotFound%s%s', id, model.name, { statusCode: 404 })
      return { data: result }
    }

    async updateRecord (model, id, body = {}, options = {}) {
      const prefix = this._getPrefixName(model)
      const key = `${prefix}:${id}`
      const old = options.noResult ? undefined : (await this.getRecord(model, id))
      const nbody = omit(merge({}, old.data, body), ['id'])
      await model.connection.client.hSet(key, nbody)
      if (options.noResult) return
      const result = await this.getRecord(model, id)
      return { oldData: old.data, data: result.data }
    }

    async removeRecord (model, id, options = {}) {
      const prefix = this._getPrefixName(model)
      const key = `${prefix}:${id}`
      const rec = options.noResult ? undefined : (await this._getRecord(model, id))
      await model.connection.client.del(key)
      if (options.noResult) return
      return { oldData: rec.data }
    }

    async clearRecord (model, options = {}) {
      const client = model.connection.client
      const prefix = this._getPrefixName(model)
      const keys = await client.keys(prefix + '*')
      for (const key of keys) {
        await model.connection.client.del(key)
      }
      return { data: true }
    }

    async findRecord (model, filter = {}, options = {}) {
      const { paginate } = this.app.lib.aneka
      const { limit, page } = filter
      const resp = await this.findAllRecord(model, filter, options)
      let result = paginate(resp.data, { page, limit })
      if (!options.count) result = omit(result, ['count', 'pages'])
      return result
    }

    async findAllRecord (model, filter = {}, options = {}) {
      const { sort } = filter
      const index = this._getIndexName(model)
      const key = Object.keys(sort)[0]
      let sortBy
      if (key) sortBy = { SORTBY: { BY: key, DIRECTION: sort[key] < 0 ? 'DESC' : 'ASC' } }
      const query = queryBuilder.call(this, filter.query ?? {}, model)
      const resp = await model.connection.client.ft.search(index, query, sortBy)
      const result = {
        data: resp.documents.map(d => d.value)
      }
      if (options.count) result.count = result.data.length
      return result
    }

    async countRecord (model, filter = {}, options = {}) {
      const index = this._getIndexName(model)
      const query = queryBuilder.call(this, filter.query ?? {}, model)
      const resp = await model.connection.client.ft.search(index, query)
      const data = resp.documents.map(d => d.value)
      return { data: data.length }
    }

    async createAggregate (model, filter = {}, params = {}, options = {}) {
      const item = await this.findAllRecord(model, filter, options)
      const result = this.app.dobo.calcAggregate({ data: item.data, ...params })
      return { data: result }
    }

    async createHistogram (model, filter = {}, params = {}, options = {}) {
      const item = await this.findAllRecord(model, filter, options)
      const result = this.app.dobo.calcHistogram({ data: item.data, ...params })
      return { data: result }
    }
  }

  return RedisDriver
}

export default redisDriverFactory
