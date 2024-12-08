const mongoose = require('mongoose')
const config = require('./config')
const express = require("express")

mongoose.connect(config.database).then(() => {
    console.log('Connected')

    const app = express()
    app.use(express.static('public'))
})






