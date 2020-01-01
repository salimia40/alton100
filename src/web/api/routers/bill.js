const express = require('express')
const middleware = require('../middlewares')

const Bill = require('../../../model/Bill')


const router = express.Router()
router.use(middleware.authMiddleWare)

router.route('/')
    .get(
        async (req, res) => {
            var bills
            if(req.query.range){
                var range = JSON.parse(req.query.range)
                console.log(range)
                bills = await Bill.find().skip(range[0]).limit(range[1] )
            }
            else
                bills = await Bill.find()
            var total = await Bill.countDocuments()

            res.json({data: bills,total})
        }
    )

router.route('/:billId')
    .get(   
        async (req, res) => {
            console.log(req.params.userId)
            var user = await Bill.findOne({
                id: req.params.billId
            })
            res.json({data:user})
        }
    )
    .post(
        async (req, res) => {
            var user = await Bill.findOne({
                id: req.params.billId
            })

            res.json({data:user})
        }
    )

module.exports = router