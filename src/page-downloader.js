'use strict'

/**
 * @module ページダウンロード機能を提供します。
 */
module.exports = {
  /**
   * @description リトライ回数
   */
  RetryLimit: 3,
  /**
   * @description ページをダウンロードします。
   * @param {Object} params - パラメータ
   * @param {Array} params.urls - URLリスト
   * @param {Boolean} params.override - 既に存在しているファイルを上書きするかどうか。デフォルト:false
   * @returns {Array} ファイル名リスト
   */
  async download (params) {
    const fs = require('fs')
    const { v4: uuidv4 } = require('uuid')
    const client = require('cheerio-httpcli')
    const sleep = require('thread-sleep')
    const file = require('@h/file-helper')
    const fileNames = []
    for (const url of params.urls) {
      let fileName = `resources/htmls/${uuidv4()}.html`
      if (params.fileNameGen) {
        fileName = params.fileNameGen(url)
      }
      if (!params.override) {
        if (file.existsFile(fileName)) {
          console.log(`file already exists ${fileName}`)
          fileNames.push(fileName)
          continue
        }
      }
      console.log('start sleep...')
      sleep(3000)
      console.log('end sleep')
      await client.fetch(url)
        .then((result) => {
          fs.writeFileSync(fileName
            , result.$.html()
            , { encoding: 'utf-8' }
          )
          fileNames.push(fileName)
          console.log('write end')
        })
        .catch((err) => {
          console.log(err)
        })
        .finally(() => {
          console.log('fetch end')
        })
    }
    return fileNames
  }
}
