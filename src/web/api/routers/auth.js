const codeManager = require('../../keyStore')

const express = require('express')

const authRouter = express.Router()

authRouter.route('/login').post(
    (req, res) => {
        console.log(req.body)
        console.log(req.body.code)
        console.log(req.params)
        console.log(req.body.extra)
        if(!req.body.code) return res.sendStatus(403)
        var userId = codeManager.readCode(req.body.code)
        if(!userId) return res.sendStatus(403)
        req.session.userId = userId
        console.log(req.session)
        res.sendStatus(200)
    }
)

authRouter.route('/logout').get(
    (req, res) => {
        delete req.session.userId
        res.sendStatus(200)
    }
)

module.exports = authRouter