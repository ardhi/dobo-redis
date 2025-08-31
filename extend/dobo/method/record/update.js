import { getPrefixName } from '../../../../lib/misc.js'
import getRecord from './get.js'

async function recordUpdate ({ schema, id, body, options = {} } = {}) {
  const { merge, omit } = this.app.lib._
  const { getInfo } = this.app.dobo
  const { noResult } = options
  const { instance } = getInfo(schema)

  const prefix = getPrefixName.call(this, schema)
  const key = `${prefix}:${id}`

  const old = noResult ? undefined : await getRecord.call(this, { schema, id })
  const nbody = omit(merge({}, old.data, body), ['id'])
  await instance.client.hSet(key, nbody)
  if (noResult) return
  const result = await getRecord.call(this, { schema, id })
  return { oldData: old.data, data: result.data }
}

export default recordUpdate
