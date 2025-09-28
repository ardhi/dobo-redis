/**
 * Plugin factory
 *
 * @param {string} pkgName - NPM package name
 * @returns {class}
 */
async function factory (pkgName) {
  const me = this

  /**
   * DoboRedis class
   *
   * @class
   */
  class DoboRedis extends this.app.pluginClass.base {
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
