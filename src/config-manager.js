'use strict'

/**
 * @description 設定情報の管理機能を提供します。
 */
module.exports = {
  /**
   * @description 設定ファイルパス
   */
  ConfigFilePath: 'resources/configs/index.yml',
  /**
   * @description 設定情報
   */
  config: null,
  /**
   * @description 設定情報を取得します。
   * @returns {Object} 設定情報
   */
  get () {
    if (!module.exports.config) {
      module.exports._init()
    }
    return module.exports.config
  },
  /**
   * @description 設定情報の初期化を行います。
   * @returns {void}
   */
  _init () {
    const fs = require('fs')
    const yaml = require('js-yaml')
    module.exports.config = yaml.load(
      fs.readFileSync(
        module.exports.ConfigFilePath,
        'utf8'
      )
    )
  }
}
