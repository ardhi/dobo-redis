import { getPrefixName } from '../../../../lib/misc.js'
import getRecord from './get.js'

async function recordRemove ({ schema, id, options = {} } = {}) {
  const { getInfo } = this.app.dobo
  const { noResult } = options
  const { instance } = getInfo(schema)

  const prefix = getPrefixName.call(this, schema)
  const key = `${prefix}:${id}`

  const rec = noResult ? undefined : await getRecord.call(this, { schema, id })
  await instance.client.del(key)
  if (noResult) return
  return { oldData: rec.data }
}

export default recordRemove
