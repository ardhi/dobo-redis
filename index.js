async function factory (pkgName) {
  const me = this

  return class DoboRedis extends this.lib.BajoPlugin {
    constructor () {
      super(pkgName, me.app)
      this.alias = 'dbredis'
      this.dependencies = ['dobo']
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
}

export default factory
