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
  class DoboRedis extends this.app.baseClass.Base {
    constructor () {
      super(pkgName, me.app)
      this.config = {}
    }

    exit = async () => {
      for (const model of this.models) {
        model.connection.client.destroy()
      }
    }
  }

  return DoboRedis
}

export default factory
