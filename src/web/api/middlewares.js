const authMiddleWare = function (req,res,next) {
    // if(!req.session.userId)
    //     return res.sendStatus(403)
    next()
}

module.exports = {
    authMiddleWare
}