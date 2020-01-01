const express = require('express')
const middleware = require('../middlewares')

const Transaction = require('../../../model/Transaction')


const router = express.Router()
router.use(middleware.authMiddleWare)

router.route('/')
    .get(
        async (req, res) => {
            var users = await Transaction.find()
            
            res.json({data: users,total: users.length})
        }
    )

router.route('/:userId')
    .get(   
        async (req, res) => {
            console.log(req.params.userId)
            var user = await Transaction.findOne({
                userId: req.params.userId
            })
            res.json({data:user})
        }
    )
    .post(
        async (req, res) => {
            var user = await Transaction.findOne({
                id: req.params.userId
            })

            res.json({data:user})
        }
    )

module.exports = router