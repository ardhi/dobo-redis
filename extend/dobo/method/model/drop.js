import { getIndexName } from '../../../../lib/misc.js'

async function modelDrop ({ schema, options = {} }) {
  const { getInfo } = this.app.dobo
  const { instance } = getInfo(schema)

  const name = getIndexName.call(this, schema)
  await instance.client.ft.dropIndex(name)
}

export default modelDrop
