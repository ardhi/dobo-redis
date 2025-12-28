export function getIndexName (schema) {
  return `${this.ns}:idx:${schema.name}`
}

export function getPrefixName (schema) {
  return `${this.ns}:${schema.name}`
}
