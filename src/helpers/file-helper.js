'use strict'

const fs = require('fs')
const path = require('path')

/**
 * @module ファイル操作に関する補助機能を提供します。
 */
module.exports = {
  /**
   * @description ファイルが存在するかどうか。
   * @param {String} fileName - ファイル名
   * @returns {Boolean} ファイルが存在するかどうか
   */
  existsFile (fileName) {
    try {
      const fs = require('fs')
      const ret = fs.statSync(fileName)
      if (ret.isDirectory()) return false
      return true
    } catch (err) {
      if (err.code === 'ENOENT') return false
    }
  },
  /**
   * @description ディレクトリかどうか。
   * @param {String} fileName - ファイル名
   * @returns {Boolean} ディレクトリかどうか
   */
  isDirectory (fileName) {
    try {
      const fs = require('fs')
      const ret = fs.statSync(fileName)
      return ret.isDirectory()
    } catch (err) {
      if (err.code === 'ENOENT') return false
    }
  },
  /**
   * ファイルの削除を行います。
   * @param {String} path パス
   * @returns {void}
   */
  delete (path) {
    if (module.exports.existsFile(path)) {
      fs.unlinkSync(path)
    }
  },
  /**
   * @description 指定したディレクトリ配下の全てのファイルを削除します。
   */
  deleteAll (dir) {
    const files = fs.readdirSync(dir)
      .map(f => path.join(dir, f))
    for (const f of files) {
      fs.unlinkSync(f)
    }
  },
  /**
   * @description jsonファイルを読み込みます。
   * @param {String} path パス
   * @returns {Object} オブジェクト
   */
  read (path) {
    return fs.readFileSync(
      path,
      { encoding: 'utf-8' })
  },
  /**
   * @description jsonファイルを読み込みます。
   * @param {String} path パス
   * @returns {Object} オブジェクト
   */
  readJson (path) {
    return JSON.parse(fs.readFileSync(
      path,
      { encoding: 'utf-8' }))
  },
  /**
   * @description ファイルに書き込みます。
   * @param {Object} data データ
   * @param {String} path パス
   * @returns {void}
   */
  write (data, path) {
    fs.writeFileSync(path
      , data
      , { encoding: 'utf-8' }
    )
  },
  /**
   * @description json形式としてファイルに書き込みます。
   * @param {Object} data データ
   * @param {String} path パス
   * @returns {void}
   */
  writeJson (data, path) {
    fs.writeFileSync(path
      , JSON.stringify(data, null, '  ')
      , { encoding: 'utf-8' }
    )
  },
  /**
   * @description コピーを行います。
   * @param {String} src コピー元ファイルパス
   * @param {String} dest コピー先ファイルパス
   */
  copy (src, dest) {
    fs.copyFileSync(src, dest)
  },
  /**
   * @description ファイルの移動を行います。
   * @param {String} src 移動元ファイルパス
   * @param {String} dest 移動先ファイルパス
   */
  move (src, dest) {
    fs.renameSync(src, dest)
  },
  /**
   * @description ディレクトリを作成します。
   * @param {String} dir 作成するディレクトリ
   */
  mkdir (dir) {
    if (module.exports.isDirectory(dir)) {
      return
    }
    fs.mkdirSync(dir)
  }
}
