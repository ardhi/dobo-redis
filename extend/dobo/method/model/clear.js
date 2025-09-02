async function modelClear ({ schema, options = {} }) {
  const { getInfo } = this.app.dobo
  const { instance } = getInfo(schema)

  const indexes = await instance.client.ft._list()
  for (const index of indexes) {
    if (!index.startsWith(`${this.ns}:idx:`)) continue
    await instance.client.ft.drop(index)
  }
}

export default modelClear
