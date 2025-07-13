export function getIndexName (schema) {
  return `${this.name}:idx:${schema.name}`
}

export function getPrefixName (schema) {
  return `${this.name}:${schema.name}`
}
