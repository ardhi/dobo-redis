// from @trghost/mongo-knex/lib/convertor.js
const likeEscapeCharacter = '*'

function processRegExp ({ source, ignoreCase = true }) {
  const { escapeRegExp } = this.app.lib._
  source = source.replace(/\\([.*+?^${}()|[\]\\/])/g, '$1')
  if (ignoreCase) source = source.toLowerCase()

  source = source.replace(new RegExp(escapeRegExp(likeEscapeCharacter), 'g'), likeEscapeCharacter + likeEscapeCharacter)
  source = source.replace(/%/g, likeEscapeCharacter + '%')
  source = source.replace(/_/g, likeEscapeCharacter + '_')
  if (source.startsWith('^')) source = source.substring(1) + likeEscapeCharacter
  else if (source.endsWith('$')) source = likeEscapeCharacter + source.substring(0, source.length - 1)
  else source = likeEscapeCharacter + source + likeEscapeCharacter
  return { source, ignoreCase }
}

const helper = {
  _: function ({ key, input, cmds, schema }) {
    const nkey = Object.keys(input)[0]
    const value = input[nkey]
    if (typeof value === 'object') callHelper.call(this, { okey: key, input: value, cmds, schema })
    else helper.$eq.call(this, { key: nkey, input: value, cmds, schema })
  },
  $and: function ({ input, cmds, schema }) {
    const results = []
    for (const i of input) callHelper.call(this, { input: i, cmds: results, schema })
    cmds.push(results.join(' '))
  },
  $or: function ({ input, cmds, schema }) {
    const results = []
    for (const i of input) callHelper.call(this, { input: i, cmds: results, schema })
    cmds.push(['(', results.join('|'), ')'].join(''))
  },
  $nor: function ({ input, cmds, schema }) {
    const results = []
    for (const i of input) callHelper.call(this, { input: i, cmds: results, schema })
    cmds.push(['-', '(', results.join('|'), ')'].join(''))
  },
  $not: function ({ input, cmds, schema }) {
    const results = []
    for (const i of input) callHelper.call(this, { input: i, cmds: results, schema })
    cmds.push(['-', '(', results.join(' '), ')'].join(''))
  },
  $in: function ({ key, input, cmds, schema }) {
    if (!schema.sortables.includes(key)) return
    const items = input.map(i => {
      return `@${key}:${i}`
    })
    cmds.push(['(', items.join('|'), ')'].join(''))
  },
  $nin: function ({ key, input, cmds, schema }) {
    if (!schema.sortables.includes(key)) return
    const items = input.map(i => {
      return `@${key}:${i}`
    })
    cmds.push(['-', '(', items.join('|'), ')'].join(''))
  },
  $gt: function ({ key, input, cmds, schema }) {
    if (!schema.sortables.includes(key)) return
    cmds.push(`@${key}:[(${input} +inf]`)
  },
  $gte: function ({ key, input, cmds, schema }) {
    if (!schema.sortables.includes(key)) return
    cmds.push(`@${key}:[${input} +inf]`)
  },
  $lt: function ({ key, input, cmds, schema }) {
    if (!schema.sortables.includes(key)) return
    cmds.push(`@${key}:[-inf (${input}]`)
  },
  $lte: function ({ key, input, cmds, schema }) {
    if (!schema.sortables.includes(key)) return
    cmds.push(`@${key}:[-inf ${input}]`)
  },
  $eq: function ({ key, input, cmds, schema }) {
    if (!schema.sortables.includes(key)) return
    cmds.push(`@${key}:${input}`)
  },
  $ne: function ({ key, input, cmds, schema }) {
    if (schema.sortables.includes(key)) return
    cmds.push(`-@${key}:${input}`)
  },
  $regex: function ({ key, input, cmds, schema }) {
    const { source } = processRegExp.call(this, { source: input.source })
    cmds.push(`@${key}:${source}`)
  }
}

function callHelper ({ okey, input, cmds, schema }) {
  for (const key in input) {
    const val = input[key]
    const obj = {}
    obj[key] = val
    if (key[0] !== '$') helper._.call(this, { key, input: obj, cmds, schema })
    else if (helper[key]) helper[key].call(this, { key: okey, input: val, cmds, schema })
  }
}

function buildQuery (input, schema) {
  const cmds = []
  callHelper.call(this, { input, cmds, schema })
  return cmds.length > 0 ? cmds.join(' ') : '*'
}

export default buildQuery
