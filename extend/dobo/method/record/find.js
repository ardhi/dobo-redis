import { getIndexName } from '../../../../lib/misc.js'
import buildQuery from '../../../../lib/build-query.js'

async function recordFind ({ schema, filter = {}, options = {} } = {}) {
  const { getInfo } = this.app.dobo
  const { omit } = this.app.lib._
  const { paginate } = this.app.lib.aneka
  const { instance } = getInfo(schema)
  const { prepPagination } = this.app.dobo
  const { limit, sort, page } = await prepPagination(filter, schema)
  const index = getIndexName.call(this, schema)
  const key = Object.keys(sort)[0]
  let sortBy
  if (key) sortBy = { SORTBY: { BY: key, DIRECTION: sort[key] < 0 ? 'DESC' : 'ASC' } }
  const query = buildQuery.call(this, filter.query ?? {}, schema)
  const resp = await instance.client.ft.search(index, query, sortBy)
  const data = resp.documents.map(d => d.value)
  let result = paginate(data, { page, limit })
  if (!options.count) result = omit(result, ['count', 'pages'])
  return result
}

export default recordFind
