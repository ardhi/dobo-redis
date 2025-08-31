import { getIndexName, getPrefixName } from '../../../../lib/misc.js'

async function modelCreate ({ schema, options = {} }) {
  const { isEmpty } = this.app.lib._
  const { getInfo } = this.app.dobo
  const { instance } = getInfo(schema)

  const name = getIndexName.call(this, schema)
  const body = { id: { type: 'TEXT', sortable: true } }
  for (const p of schema.properties) {
    if (!p.index) continue
    const sortable = schema.sortables.includes(p.name)
    let type = 'TEXT'
    if (['float', 'double', 'integer', 'smallint'].includes(p.type)) type = 'NUMERIC'
    body[p.name] = { sortable, type }
  }
  if (isEmpty(body)) return
  const opts = { ON: 'HASH', PREFIX: getPrefixName.call(this, schema) }
  await instance.client.ft.create(name, body, opts)
}

export default modelCreate
