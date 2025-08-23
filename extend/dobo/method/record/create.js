import { getPrefixName } from '../../../../lib/misc.js'
import getRecord from './get.js'

async function recordCreate ({ schema, body, options = {} } = {}) {
  const { getInfo } = this.app.dobo
  const { instance } = getInfo(schema)

  const prefix = getPrefixName.call(this, schema)
  const key = `${prefix}:${body.id}`
  const result = await getRecord.call(this, { schema, id: body.id })
  if (result) throw this.error('recordExists%s%s', 'ID', body.id)
  await instance.client.hSet(key, body)
  return await getRecord.call(this, { schema, id: body.id })
}

export default recordCreate
