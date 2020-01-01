const express = require('express')
const middleware = require('../middlewares')

const User = require('../../../model/User')


const router = express.Router()
router.use(middleware.authMiddleWare)

router.route('/')
    .get(
        async (req, res) => {
            console.log(req.query.filter)
            var users = []
            var query = {}
            if(req.query.filter) {
                var filter = JSON.parse(req.query.filter)
                if(filter.id){

                    if(Array.isArray(filter.id)){
                        query.userId = { $in: filter.id }
                        // for (let i = 0; i < filter.id.length; i++) {
                        //     const element = filter.id[i];
                        //     users.push(await User.findOne({userId: element}))
                            
                        // }
                        // return res.json({data: users,total: users.length})
                    }
                }
            }
            // 
            if(req.query.range) {
                var range = JSON.parse(req.query.range)
                users = await User.find(query).skip(range[0]).limit(range[1] )
            } else
            users = await User.find(query)

            
            res.json({data: users,total: users.length})
        }
    )



router.route('/me').get(
    async (req, res) => {

        var user = await User.findOne({
            userId: req.session.userId
        })
        res.json({data: user})
    }
)


router.route('/:userId')
    .get(   
        async (req, res) => {
            console.log(req.params.userId)
            console.log(req.query.filter)
            var user = await User.findOne({
                userId: req.params.userId
            })
            res.json({data:user})
        }
    )
    .post(
        async (req, res) => {
            var user = await User.findOne({
                userId: req.params.userId
            })

            res.json({data:user})
        }
    )

module.exports = router