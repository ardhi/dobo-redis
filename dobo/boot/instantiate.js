import { createClient } from 'redis'

async function instantiate ({ connection, schemas, noRebuild }) {
  const { pick } = this.lib._
  this.instances = this.instances ?? []
  const instance = pick(connection, ['name', 'type'])
  const { connection: conn } = connection
  let url = conn.url
  if (!url) {
    url = 'redis://'
    if (conn.user) url += `${conn.user}:${conn.password}@`
    url += `${conn.host}:${conn.port}/${conn.database ?? '0'}`
  }
  instance.client = await createClient({ url })
  instance.client.connect()
  this.instances.push(instance)
}

export default instantiate
