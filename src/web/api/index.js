const express = require('express')
const apiRouter = express.Router()
const bodyParser = require('body-parser')
const session = require('express-session')
const middleWares = require('./middlewares')

const User = require('../../model/User')

const routers = require('./routers')

apiRouter.use(bodyParser.urlencoded({
    extended: false
}))
apiRouter.use(session({
    secret: 'djfibhihjoigjsdiopfiew90r8409t738eifjdifweu03899rueijfdi',
    resave: false,
    saveUninitialized: false,
    // cookie: {
    //     maxAge: 10 * 60 * 1000
    // }
}))

apiRouter.use((req, res, next) => {
    if (req.header('token') == undefined || req.header('token') != '3cbff87769374b59aaf7d4bb7cbb0120') return res.sendStatus(401)
    next()
})

apiRouter.route('/status').get(
    async (req, res) => {
        var response = {}
        console.log(req.session)
        if(!req.session.userId) {
            response.loggedIn = false
            console.log(response)
            return res.json(response)
        }
        response.loggedIn = true
        response.userId = req.session.userId
        var user = await User.findOne({
            userId: req.session.userId
        })
        response.role = user.role
        response.name = user.name
        response.username = user.username
        console.log(response)
        res.json(response)
    }
)

apiRouter.use('/auth', routers.authRouter)
apiRouter.use('/user', routers.userRouter)
apiRouter.use('/setting', routers.settingRouter)
apiRouter.use('/bill', routers.billRouter)
apiRouter.use('/transaction', routers.transactionRouter)

module.exports = apiRouter