import { getIndexName } from '../../../../lib/misc.js'

async function modelExists ({ schema, options = {} }) {
  const { getInfo } = this.app.dobo
  const { instance } = getInfo(schema)

  const name = getIndexName.call(this, schema)
  const indexes = await instance.client.ft._list()
  return indexes.includes(name)
}

export default modelExists
