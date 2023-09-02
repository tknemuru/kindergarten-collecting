'use strict'

const puppeteer = require('puppeteer')
const requestClient = require('request-promise-native')
const sleep = require('thread-sleep')

/**
 * @description リトライ上限数
 */
const RetryLimit = 3

/**
 * @module HTMLに関する補助機能を提供します。
 */
module.exports = {
  /**
   * @description HTMLファイルからdomを生成します。
   * @param {String} fileName - ファイル名
   * @returns {Object} dom
   */
  toDom (fileName) {
    const fs = require('fs')
    const html = fs.readFileSync(fileName, { encoding: 'utf-8' })
    const jsdom = require('jsdom')
    const { JSDOM } = jsdom
    const virtualConsole = new jsdom.VirtualConsole()
    const dom = new JSDOM(html, { virtualConsole })
    return dom
  },
  /**
   * @description HTMLファイルからjQueryオブジェクトを生成します。
   * @param {String} fileName - ファイル名
   * @returns {Object} jQueryオブジェクト
   */
  toJQueryObj (fileName) {
    const fs = require('fs')
    const html = fs.readFileSync(fileName, { encoding: 'utf-8' })
    const cheerio = require('cheerio')
    const $ = cheerio.load(html)
    return $
  },
  /**
   * @description puppeteerのページを開きます。
   * @param {String} url URL
   * @param {Function} callback ページを開いた際に呼び出すコールバック関数
   * @param {Object} params パラメータ
   * @returns {void}
   */
  async openPuppeteerPage (url, callback, params) {
    let count = 0
    let success = true
    let browser
    let page = {}
    try {
      while (count < RetryLimit) {
        try {
          console.log('start sleep...')
          sleep(3000)
          console.log('end sleep')
          browser = await puppeteer.launch({
            args: ['--lang=ja,en-US,en']
          })
          page = await browser.newPage()
          await page.setExtraHTTPHeaders({
            'Accept-Language': 'ja-JP'
          })
          console.log('page goto start')
          await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 })
          console.log('page goto end')
          success = true
        } catch (e) {
          console.log(e)
          success = false
        } finally {
          count++
        }
        if (success) break
      }
      await callback(browser, page, params)
    } finally {
      if (browser) {
        browser.close()
      }
    }
  },
  /**
   * @description puppeteerの新規ページを選択します。
   * @param {Object} browser ブラウザ
   */
  async selectNewPuppeteerPage (browser, page) {
    await page.waitForTimeout(5000)
    const pages = await browser.pages()
    const newPage = pages[pages.length - 1]
    await newPage.bringToFront()
    // await newPage.waitForTimeout(5000)
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', () => {})
      // eslint-disable-next-line no-proto
      delete navigator.__proto__.webdriver
    })
    return newPage
  },
  /**
   * @description puppeteerのページから送られるリクエストをキャプチャします。
   * @param {Object} page ページ
   */
  async captureRequest (page) {
    await page.setRequestInterception(true)
    page.on('request', request => {
      requestClient({
        uri: request.url(),
        resolveWithFullResponse: true
      }).then(response => {
        const requestUrl = request.url()
        const requestHeaders = request.headers()
        const requestPostData = request.postData()
        const responseHeaders = response.headers
        const responseSize = responseHeaders['content-length']
        const responseBody = response.body
        const result = []
        result.push({
          requestUrl,
          requestHeaders,
          requestPostData,
          responseHeaders,
          responseSize,
          responseBody
        })
        console.log(result)
        request.continue()
      }).catch(error => {
        console.error(error)
        request.abort()
      })
    })
  },
  /**
   * @description ファイルが存在するかどうか。
   * @param {String} fileName - ファイル名
   * @returns {Boolean} ファイルが存在するかどうか
   */
  existsFile (fileName) {
    try {
      const fs = require('fs')
      fs.statSync(fileName)
      return true
    } catch (err) {
      if (err.code === 'ENOENT') return false
    }
  }
}
