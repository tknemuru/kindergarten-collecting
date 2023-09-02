'use strict'

const downloader = require('@/page-downloader')
const fileHelper = require('@h/file-helper')
const htmlHelper = require('@h/html-helper')
const createCsvWriter = require('csv-writer').createObjectCsvWriter
const { v4: uuidv4 } = require('uuid')
const fs = require('fs')

/**
 * @description 情報収集機能を提供します。
 */
 module.exports = {
     /**
      * 情報を収集してCSV出力します。
      * 
      * @param {Object} params パラメータ
      */
    async collect (params) {
        // 親画面のダウンロードを行う
        if (params.requiredParentsDownload) {
            // ディレクトリ配下のファイルを削除
            if (params.allClear) {
                fileHelper.deleteAll(params.allParentsDir)
            }
            fileHelper.deleteAll(params.currParentsDir)

            await downloadParentPages(params)
        }

        // 施設個別ページをダウンロード
        if (params.requiredKindersDownload) {
            // ディレクトリ配下のファイルを削除
            if (params.allClear) {
                fileHelper.deleteAll(params.allKindersDir)
            }
            fileHelper.deleteAll(params.currKindersDir)

            // 施設個別ページをダウンロード
            const hrefs = extractKinderUrls(params)
            await downloadKinderPages(hrefs, params)
        }

        // CSV作成
        const files = fs.readdirSync(getKindersDir(params))
        await createCsv(files, params)
    }
}

/**
 * 親画面ディレクトリを取得します。
 * 
 * @param {Object} params パラメータ
 * @returns 親画面ディレクトリ
 */
function getParentsDir (params) {
    return params.requiredAllOutput ? params.allParentsDir : params.currParentsDir
}

/**
 * 施設画面ディレクトリを取得します。
 * 
 * @param {Object} params パラメータ
 * @returns 施設画面ディレクトリ
 */
function getKindersDir (params) {
    return params.requiredAllOutput ? params.allKindersDir : params.currKindersDir
}

/**
 * 親画面をダウンロードします。
 * 
 * @param {Object} params パラメータ
 */
async function downloadParentPages (params) {
    const parentsDir = getParentsDir(params)
    await downloader.download({
        urls : params.targetUrls,
        fileNameGen: url => `${parentsDir}/${uuidv4()}.html`
      })
}

/**
 * 施設画面のURLを抽出します。
 * 
 * @param {Object} params パラメータ
 * @returns 施設画面のURL
*/
function extractKinderUrls (params) {
    const parentsDir = getParentsDir(params)
    const files = fs.readdirSync(parentsDir)
    let allHrefs = []
    for (const file of files) {
        const $ = htmlHelper.toJQueryObj(`${parentsDir}/${file}`)
        const atags = $('a')
        let hrefs = []
        for (let i = 0; i < atags.length; i++) {
            hrefs.push(atags.eq(i).attr('href'))
        }
        hrefs = hrefs
            .filter(h => (h || '').includes('spdesc.php'))
            .map(h => `${params.baseUrl}/${h}`)
        allHrefs = allHrefs.concat(hrefs)
    }
    return allHrefs
}

/**
 * 施設画面をダウンロードします。
 * 
 * @param {Object} params パラメータ
*/
async function downloadKinderPages (hrefs, params) {
    await downloader.download({
        urls: hrefs,
        fileNameGen: url => `${params.currKindersDir}/${url.split('=')[1]}.html`
      })
    await downloader.download({
        urls: hrefs,
        fileNameGen: url => `${params.allKindersDir}/${url.split('=')[1]}.html`
      })
}

/**
 * CSVを作成します。
 * 
 * @param {Array} files 施設画面htmlリスト
 * @param {Object} params パラメータ
*/
async function createCsv (files, params) {
    const results = []
    const header = []
    header.push({
        id: 'kinderName',
        title: '保育施設名'
        })
    for (const file of files) {
        const $ = htmlHelper.toJQueryObj(`${getKindersDir(params)}/${file}`)
        const trs = $('.map tr')
        const row = {}

        const kinderName = $('.subsubtitle').eq(0).text()
        row['kinderName'] = kinderName
        for (let i = 0; i < trs.length; i++) {
            const th = trs.eq(i).find('th > a')
            const title = th.text()
            let id = title
            const exists = header.some(h => h.id === id)
            if (!exists) {
                header.push({
                    id,
                    title
                })
            }

            let td = {}
            let value
            switch (title) {
                case '住所':
                    td = trs.eq(i).find('td > div > pre')
                    value = td.text()
                    const href = trs.eq(i).find('td > div > a').attr('href')
                    row[id] = value
                    if (!exists) {
                        header.push({
                            id: 'addressMap',
                            title: '住所の地図'
                        })
                    }
                    row['addressMap'] = href
                    break;
                case 'URL':
                    value = trs.eq(i).find('td > a').attr('href')
                    row[id] = value
                    break;
                default:
                    td = trs.eq(i).find('td > pre')
                    value = td.text()
                    row[id] = value
                    break;
            }
        }
        results.push(row)
    }

    const csvWriter = createCsvWriter({
        path: 'resources/csvs/kinder.csv',
        header
      })
    await csvWriter.writeRecords(results)
}