'use strict'

require('module-alias/register')

const configManger = require('@/config-manager')
const config = configManger.get()
console.log(config)

const collector = require('@/collector')
collector.collect(config)
console.log('end')
