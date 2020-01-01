const Scene = require('telegraf/scenes/base')
const Transaction = require('../model/Transaction')
const {
    leave
} = require('telegraf/stage')
const User = require('../model/User')
const Bill = require('../model/Bill')
const helpers = require('../helpers')
const queue = require('../queue')
const Settle = require('../model/Settle')
const config = require('../config')
const Markup = require('telegraf/markup')


const scene = new Scene('semisettleScene')
scene.enter((ctx) => {
    ctx.reply('لطفا نرخ تسویه را به هزار تومان به صورت عددی وارد نمایید.', Markup.inlineKeyboard([
        [{
            text: 'انصراف',
            callback_data: 'cancel'
        }]
    ]).resize().extra())
})


scene.action('cancel', (ctx, next) => {
    ctx.deleteMessage()
    next()
}, leave())

scene.hears(/\d+/, async (ctx, next) => {

    var c = ctx.match[0]
    c = +c
    var price = c

    var user = ctx.user

    var bills = await Bill.find({
        userId: user.userId,
        // closed: true,
        expired: false,
        settled: false
    })


    var commition = ctx.setting.getCommition()

    var comm = commition
    if (user.config.vipOff == -1) {

        switch (user.role) {
            case config.role_vip:
                var off = ctx.setting.getVipOff()
                comm = comm * off
                comm = comm / 100
                break
            case config.role_owner:
                comm = 0
                break
        }
    } else {
        comm = comm * user.config.vipOff
        comm = comm / 100
    }

    var totalCommition = 0
    var totalProfit = 0
    var sold = 0

    for (var index = 0; index < bills.length; index++) {
        var bill = bills[index]
        if (bill.closed) {
            if (bill == undefined) continue
            var res = bill.close({
                comm,
                price
            })
            sold += res.am
            bill.settled = true
            totalCommition += bill.commition
            totalProfit += bill.profit
        } else {
            bill.expired = true
        }
    }

    if (sold < 0) sold = Math.abs(sold)

    var prf = totalProfit - totalCommition
    var d = (prf > 0) ? 'سود' : 'ضرر'
    prf = Math.abs(prf)

    var umsg = config.samples.settleMsg
        .replace('x', helpers.dateToString(Date.now()))
        .replace('x', helpers.toman(c))
        .replace('x', helpers.toman(prf))
        .replace('x', d)

    umsg += `این گزارش صرفا جهت نمایش تهیه شده است`

    ctx.reply(umsg)

    next()
}, leave())

module.exports = scene