
const codeManager = require('./keyStore')

module.exports = {
    getCode : (ctx) => {
        var userId = ctx.chat.id
        var code = codeManager.genCode(userId)
        ctx.reply(code)
    }
}