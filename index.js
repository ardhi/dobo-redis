async function factory (pkgName) {
  const me = this

  class DoboRedis extends this.lib.Plugin {
    static alias = 'dbredis'
    static dependencies = ['dobo']

    constructor () {
      super(pkgName, me.app)
      this.config = {
        connections: []
      }
    }

    exit = () => {
      for (const instance of this.instances) {
        instance.client.destroy()
      }
    }
  }

  return DoboRedis
}

export default factory
