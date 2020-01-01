const Composer = require('telegraf/composer')
const queue = require('./queue')
const config = require('./config')
const hears = require('./hear')
const helpers = require('./helpers')

const handler = new Composer()

handler.hears(/\d+\s*(ف|خ)\s*\d+/, async (ctx, next) => {
    if(ctx.user.role == config.role_admin || ctx.user.role == config.role_owner) {
        try {
            ctx.deleteMessage()
        } catch (error) {
            //
        }
    } 
    next()
} , async (ctx, next) => {

    if (/\d+\s*(ف|خ)\s*\d+\.5\s*\*/.test(ctx.match.input)) {
        ctx.withHalf = true
        ctx.sellAsWhole = true
    }
    if (/\d+\s*(ف|خ)\s*\d+\s*\*/.test(ctx.match.input)) {
        ctx.withHalf = false
        ctx.sellAsWhole = true
    } else if (/\*\d+\s*(ف|خ)\s*\d+\.5/.test(ctx.match.input)) {
        ctx.withHalf = true
        ctx.sellAsWhole = true
    } else if (/\d+\s*(ف|خ)\s*\d+\.5/.test(ctx.match.input)) {
        ctx.withHalf = true
        ctx.sellAsWhole = false
    } else if (/\*\d+\s*(ف|خ)\s*\d+/.test(ctx.match.input)) {
        ctx.withHalf = false
        ctx.sellAsWhole = true
    } else {
        ctx.withHalf = false
        ctx.sellAsWhole = false
    }
    next()
}, hears.validateOffer, hears.prossessOffer, helpers.makeDeal)


handler.hears(/^\d+$/, async (ctx, next) => {
    if(ctx.user.role == config.role_owner || ctx.user.role == config.role_admin) {
        try {
            ctx.deleteMessage()
        } catch (error) {
            //
        }
    } 
    next()
}, hears.offerByAmount)

var midlware = handler.middleware()

var pushToHandler = (ctx) => {
    queue.push(() => {
        midlware(ctx)
    })
}

module.exports = handler
module.exports.pushToHandler = pushToHandler