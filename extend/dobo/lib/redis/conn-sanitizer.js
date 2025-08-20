async function connSanitizer (payload) {
  payload.connection = payload.connection ?? {}
  payload.connection.port = payload.connection.port ?? 6379
  payload.connection.host = payload.connection.host ?? '127.0.0.1'
  return payload
}

export default connSanitizer
