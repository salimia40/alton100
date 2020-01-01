const express = require('express')
const middleware = require('../middlewares')

const Setting = require('../../../model/Setting')


const router = express.Router()
router.use(middleware.authMiddleWare)

router.route('/')
    .get(
        async (req, res) => {
            console.log(Setting.self())
            res.json(Setting.self())
        }
    )
    .post(
        async (req, res) => {
            // console.log(Setting.self())
            // res.json(Setting.self())
        }
    )

module.exports = router