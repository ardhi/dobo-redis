import { getPrefixName } from '../../../../lib/misc.js'

async function recordGet ({ schema, id, options = {} } = {}) {
  const { getInfo } = this.app.dobo
  const { instance } = getInfo(schema)
  const { thrownNotFound = true } = options

  const prefix = getPrefixName.call(this, schema)
  const key = `${prefix}:${id}`
  const result = await instance.client.hGetAll(key)
  if (!result && thrownNotFound) throw this.error('recordNotFound%s%s', id, schema.name, { statusCode: 404 })
  return { data: result }
}

export default recordGet
