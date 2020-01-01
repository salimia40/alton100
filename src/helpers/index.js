const groupsThatImAdmin = []
const Bill = require('../model/Bill')
const User = require('../model/User')
const config = require('../config')
const Commition = require('../model/Commition')
const setting = require('../model/Setting')
const {
    billToSring,
    sellerBillToString,
    buyerBillToString
} = require('./billParser')

const {
    dateToString,
    asyncForEach,
    toman,
    matchTolerance,
    maxGold,
    countProfit,
    parseLafz,
    maxCanBuy,
    maxCanSell,
    buyAvg,
    sellAvg,
    formatNumber
} = require('./core')

function justPersian(str) {
    var p = /^[\u0600-\u06FF\u0698\u067E\u0686\u06AF\s0-9]+$/;
    return p.test(str)
}

const {
    printImage,
    printPDF
} = require('./print')

const opfImage = async (ctx, opfs) => {
    let rows = ''
    let i = 0
    for (var z = 0; z < opfs.length; ++z) {
        let bill = opfs[z]
        let style, deal
        if (bill.isSell) {
            style = 'bg-danger'
            deal = 'فروش'

        } else {
            style = 'bg-primary'
            deal = 'خرید'

        }

        rows += config.templates.opfRow.replace("INDEX", ++i)
            .replace("DEAL-STYLE", style)
            .replace("DEAL", deal)
            .replace('AMOUNT', bill.left)
            .replace('PRICE', toman(bill.price))
            .replace('CODE', bill.code)

    }

    let content = config.templates.opfTemp.replace('ROWS', rows)
        .replace('NAME', ctx.user.name)
        .replace('DATE', dateToString(Date.now()))

    let res = await printImage(content)
    return res

}

const transactionsImage = async (user, transactions) => {
    let rows = ''
    let i = 0
    transactions = transactions.sort((a, b) => {
        a.date < b.date
    })
    for (var z = 0; z < transactions.length; ++z) {
        let transaction = transactions[z]
        let style, deal
        if (!transaction.ischarge) {
            style = 'bg-danger'
            deal = 'برداشت'

        } else {
            style = 'bg-primary'
            deal = 'واریز'
        }

        rows += config.templates.transRow.replace("CODE", transaction.code)
            .replace("DEAL-STYLE", style)
            .replace("CHARGETYPE", deal)
            .replace('AMOUNT', toman(transaction.charge))
            .replace('DATE', dateToString(transaction.date))
            .replace('EXPLAIN', transaction.explain)
    }


    let content = config.templates.transTemp.replace('ROWS', rows)

    let res = await printPDF(content)
    return res

}

const allUsersPDF = async (users) => {
    var lines = ''
    await asyncForEach(users, async user => {
        var role
        switch (user.role) {
            case config.role_owner:
                role = 'مالک'
                break
            case config.role_admin:
                role = 'مدیر'
                break
            case config.role_bot:
            case config.role_bot_assistant:
                role = 'ربات'
                break
            case config.role_vip:
                role = 'vip'
                break
            case config.role_eccountant:
                role = 'حسابدار'
                break
            default:
                role = 'کاربر معمولی'
        }
        // lines += `${user.userId}\t${role}\t${user.name}\t${user.username}\t${user.phone}\t${user.charge}`

        // if(user)
        lines += config.templates.userRow
            .replace('ID', user.userId)
            .replace('ROLE', role)
            .replace('NAME', user.name)
            .replace('USERNAME', user.username)
            .replace('PHONE', user.phone)
            .replace('CHARGE', toman(user.charge))

    })

    var content = config.templates.userTable.replace('ROWS', lines)

    var res = await printPDF(content)
    return res

}

const monthlyReportImage = async (settles, user) => {
    let rows = ''
    let index = 0
    var profit = 0
    var commition = 0
    for (var z = 0; z < settles.length; z++) {
        var settle = settles[z]

        profit += settle.profit
        commition += settle.commition

        rows += config.templates.mrRow
            .replace("INDEX", ++index)
            .replace("DATE", dateToString(settle.date))
            .replace("RATE", toman(settle.price))
            .replace("PROFIT", toman(settle.profit))
            .replace("COMMITION", toman(settle.commition))
            .replace('SUM', toman(settle.profit - settle.commition))

    }
    rows += config.templates.mrRowLast
        .replace('PROFIT', toman(profit))
        .replace('COMMITION', toman(commition))
        .replace('SUM', toman(profit - commition))

    let content = config.templates.mrTemp.replace('ROWS', rows).replace('NAME', user.name)
    let res = await printPDF(content)
    return res
}

const postSettleImage = async (user, bills) => {
    let rows = ''
    let index = 0
    for (var z = 0; z < bills.length; z++) {
        var bill = bills[z]

        let style, deal
        if (bill.isSell) {
            style = 'bg-danger'
            deal = 'فروش'

        } else {
            style = 'bg-primary'
            deal = 'خرید'

        }

        var oppId
        if (bill.isSell) {
            oppId = bill.buyerId
        } else {
            oppId = bill.sellerId
        }
        var opp = await User.findOne({
            userId: oppId
        })

        rows += config.templates.psrRow
            .replace("DEAL-STYLE", style)
            .replace("DEAL", deal)
            .replace("DATE", dateToString(bill.date))
            .replace("RATE", toman(bill.price))
            .replace("AMOUNT", bill.amount)
            .replace("OPPO", opp.username)
            .replace("CODE", bill.code)
            .replace("CONDITION", bill.condition)

    }


    let content = config.templates.psrTemp.replace('ROWS', rows)
    let res = await printPDF(content)
    return res
}


const isGroupAdmin = async (ctx, botUser) => {
    let isBdmin = false
    if (groupsThatImAdmin.includes(ctx.chat.id)) isBdmin = true
    if (isBdmin) return isBdmin
    var mems = await ctx.telegram.getChatAdministrators(ctx.chat.id)

    await asyncForEach(mems, mem => {
        if (mem.user.id == botUser.id) {
            groupsThatImAdmin.push(ctx.chat.id)
            isBdmin = true
        }
    })
    return isBdmin
}
const countAwkwardness = async (ctx, bill) => {

    var awk
    var user = await User.findOne({
        userId: bill.userId
    })

    var obills = await Bill.find({
        userId: user.userId,
        closed: true,
        left: {
            $gt: 0
        }
    })

    var oss = 0
    obills.forEach(s => {
        if (s.isSell)
            oss += s.left
        else
            oss -= s.left
    })

    var isSell = oss > 0

    var avg
    if (isSell) {
        avg = await sellAvg(user.userId)
    } else {
        avg = await buyAvg(user.userId)
    }
    var q = avg

    awk = user.getCharge() * 4.3318 / 100

    obills = await Bill.find({
        userId: bill.userId,
        closed: true,
        left: {
            $gt: 0
        },
        isSell
    })

    var os = 0

    await asyncForEach(obills, obill => {
        os += obill.left
    })

    if (os == 0) return {
        awk: 0,
        sellprice: 0
    }

    awk *= 0.85

    awk = awk / os

    var t = setting.getTolerance()

    if (isSell) {
        awk = q + awk
    } else {
        awk = q - awk
    }

    var sellprice = awk


    if (isSell) {
        sellprice += t
    } else {
        sellprice -= t
    }

    var tempAwk = awk
    var tempPr = sellprice
    if (isSell) {
        sellprice = Math.floor(tempPr)
        awk = Math.floor(tempAwk)
    } else {
        sellprice = Math.ceil(tempPr)
        awk = Math.ceil(tempAwk)
    }

    if (user.awkwardness.awk != awk) {
        user.awkwardness = {
            awk,
            sellprice,
            awked: false,
            isSell
        }
        await user.save()
    }

    return {
        awk,
        sellprice
    }
}

const userToString = async (ctx) => {
    let user = ctx.user
    let res = `شماره کاربری : ${user.userId}
نام : ${user.name}
نام کاربری : ${user.username}
تلفن: ${user.phone} \n`
    res += `مقدار پس انداز : ${toman(user.charge)} تومان
${user.bank.number == undefined ? `` : `شماره کارت : ${user.bank.number}`}
${user.config.vipOff == -1 ? '' : `تخفیف کیسیون : ${100 - user.config.vipOff}`}
${user.config.baseCharge == -1 ? '' : `وجه تضمین برای واحد : ${toman(user.config.baseCharge)}`}
        `
    return res.trim();
}

const userToStringByUser = async (user) => {

    let res = `شماره کاربری : ${user.userId}
نام : ${user.name}
نام کاربری : ${user.username}
تلفن: ${user.phone} \n`
    res += `مقدار پس انداز : ${toman(user.charge)} تومان
شماره کارت : ${user.bank ? user.bank.number : ''}
${user.config ? user.config.vipOff == -1 ? '' : `تخفیف کیسیون : ${user.config.vipOff}` : ''}
${user.config ? user.config.baseCharge == -1 ? '' : `وجه تضمین برای واحد : ${user.config.baseCharge}` : ''}
        `
    return res;
}


const closeDeals = async (ctx, b, price) => {
    let totalProfit = 0
    let factorsClosed = 0
    let totalCommition = 0
    let billsRemained = 0

    let bills = await Bill.find({
        userId: b.userId,
        closed: true,
        expired: false,
        isSell: !b.isSell,
        left: {
            $gt: 0
        }
    })
    let am = b.amount
    let commition = ctx.setting.getCommition()
    var user = await User.findOne({
        userId: b.userId
    })

    if (user.config.vipOff == -1) {


        switch (user.role) {
            case config.role_vip:
                var off = ctx.setting.getVipOff()
                commition *= off
                commition /= 100
                break
            case config.role_owner:
                commition = 0
                break
        }
    } else {
        commition *= user.config.vipOff
        commition /= 100
    }

    var index = 0
    while (index < bills.length) {
        var bill = bills[index++]
        var res = bill.sell({
            am,
            price,
            comm: commition
        })

        console.log(res)

        if (res.closed) {
            factorsClosed++
        }

        totalCommition += res.commition
        totalProfit += res.profit
        billsRemained += bill.left

        am = res.am

        await bill.save()

        if (am == 0) break
    }

    return {
        totalCommition,
        totalProfit,
        factorsClosed,
        amountLeft: am,
        billsRemained
    }
}

const assistant = require('../assistant')

const announceBill = async (ctx, bill, expire = true) => {
    let z
    let emo
    if (bill.isSell) {
        emo = '🔴'
        z = 'ف'

    } else {
        emo = '🔵'
        z = 'خ'
    }
    let usr = await User.findOne({
        userId: bill.userId
    })

    var group = await ctx.setting.getActiveGroup()

    var delay = await ctx.setting.getDelay()
    let msg
    if (bill.sellAsWhole) {
        msg = emo + '  ' + usr.username + ' <b>* ' + bill.amount + ' ' + z + ' ' + bill.price + ' </b> ' + ''
    } else
        msg = emo + '  ' + usr.username + ' <b> ' + bill.amount + ' ' + z + ' ' + bill.price + ' </b> ' + ''
    if (!expire) {
        msg = msg + '📣'
    }

    const extra = require('telegraf/extra')
    // const markup = extra.markdown()
    const markup = extra.HTML()
    let res = await assistant.sendMessage(group, msg,
        markup
    )
    bill.messageId = res.message_id
    await bill.save()
    if (expire)
        setTimeout(async () => {
            bill = await Bill.findById(bill._id)
            if (bill == undefined) {
                console.log('hmmmm')
            } else if (!bill.closed && !bill.expired) {
                Bill.findByIdAndDelete(bill._id).exec()
            }
            if (bill != undefined && bill.expired) {
                Bill.findByIdAndDelete(bill._id).exec()
            }
        }, delay * 1000)
}


const makeDeal = async (ctx) => {
    let {
        isSell,
        sellerId,
        buyerId,
        amount,
        price,
        bill
    } = ctx.values
    if (sellerId == buyerId) return
    let sellerBill, buyerBill, cb
    cb = await ctx.setting.getCode()

    if (isSell) {
        if (bill.amount == amount) {
            buyerBill = Object.assign(bill, {
                code: cb,
                closed: true,
                isSell: false,
                date: Date.now(),
                left: amount,
                sellerId,
                buyerId,
            })
        } else {

            buyerBill = new Bill({
                code: cb,
                isSell: false,
                closed: true,
                userId: buyerId,

                date: Date.now(),
                left: amount,
                sellerId,
                buyerId,
                amount: amount,
                price: price
            })

            /**update bill */
            // var a = bill.amount
            bill.amount -= amount
            bill = await bill.save()
            // reaa = true
        }
        sellerBill = new Bill({
            code: cb,
            isSell: true,
            closed: true,
            userId: sellerId,
            left: amount,
            sellerId,
            buyerId,
            amount: amount,
            date: Date.now(),
            price: price
        })
    } else {
        if (bill.amount == amount) {
            sellerBill = Object.assign(bill, {
                code: cb,
                closed: true,
                isSell: true,
                date: Date.now(),

                left: amount,
                sellerId,
                buyerId,
            })
        } else {
            sellerBill = new Bill({
                code: cb,
                isSell: true,
                closed: true,
                userId: sellerId,
                date: Date.now(),

                left: amount,
                sellerId,
                buyerId,
                amount: amount,
                price: price
            })
            /**update bill */
            // var a = bill.amount
            bill.amount -= amount
            bill = await bill.save()
            // reaa = true
        }
        buyerBill = new Bill({
            code: cb,
            isSell: false,
            closed: true,
            userId: buyerId,
            date: Date.now(),
            left: amount,
            sellerId,
            buyerId,
            amount: amount,
            price: price
        })
    }

    let selRes = await closeDeals(ctx, sellerBill, price)
    let buyRes = await closeDeals(ctx, buyerBill, price)

    sellerBill.left = selRes.amountLeft
    console.log(selRes.amountLeft)
    console.log(buyRes.amountLeft)
    buyerBill.left = buyRes.amountLeft
    sellerBill = await sellerBill.save()
    buyerBill = await buyerBill.save()
    sellerBill.awkwardness = await countAwkwardness(ctx, sellerBill)
    buyerBill.awkwardness = await countAwkwardness(ctx, buyerBill)
    sellerBill = await sellerBill.save()
    buyerBill = await buyerBill.save()

    let suser = await User.findOne({
        userId: sellerBill.userId
    })

    let buser = await User.findOne({
        userId: buyerBill.userId
    })

    buser.charge += buyRes.totalProfit
    buser.charge -= buyRes.totalCommition
    suser.charge += selRes.totalProfit
    suser.charge -= selRes.totalCommition


    suser.block = await recountBlock(suser.block, amount, true, suser.userId)
    buser.block = await recountBlock(buser.block, amount, false, buser.userId)

    await buser.save()
    await suser.save()
    checkAwk(ctx, buser)
    checkAwk(ctx, suser)

    await recieveUserCommitions({
        userId: buyerId,
        amount: buyRes.totalCommition
    }, {
        userId: sellerId,
        amount: selRes.totalCommition
    })

    let sb = await billToSring(sellerBill, selRes)
    let bb = await billToSring(buyerBill, buyRes)
    if (ctx.setting.shouldShowFacts()) {
        let prev = await billPrev(sellerBill)
        let group = setting.getActiveGroup()
        assistant.sendMessage(group, prev)
    }

    try {
        ctx.telegram.sendMessage(sellerId, sb)
        ctx.telegram.sendMessage(buyerId, bb)
    } catch (error) {
        //
    }
}

const recountBlock = async (block, amount, isSell, userId) => {
    var log = `${userId}: ${isSell} : ${block.isSell} ${block.value} -> `
    if ((!block.isSell && isSell) || (block.isSell && !isSell)) {
        if (block.value > 0) {
            var bills = await Bill.find({
                userId,
                isSell: block.isSell,
                closed: true,
                settled: false,
                left: {
                    $gt: 0
                }
            })
            var x = 0
            await asyncForEach(bills, async bill => {
                var z = bill.left
                x += z
            })
            if (x < block.value) block.value = x
            if (block.value < 0) block.value = 0
        }
    }
    log += `${block.value}`
    console.log(log)
    return block
}


const recieveCommitions = async (...commitions) => {

    var bt = await User.findOne({
        role: config.role_bot
    })
    await asyncForEach(commitions, async c => {
        console.log(`recieved com: ${c}`)
        if (c == undefined) return
        bt.charge += c
        var commition = new Commition({
            amount: c
        })
        await commition.save()
    })

    await bt.save()

}

const recieveUserCommitions = async (...commitions) => {

    var tot = 0
    await asyncForEach(commitions, async c => {
        if (c.amount < 1) return
        tot += c.amount
        console.log(`recieved com: ${c}`)
        var commition = new Commition({
            ...c
        })
        await commition.save()
    })

    if (tot == 0) return

    User.findOneAndUpdate({
        role: config.role_bot
    }, {
        $inc: {
            charge: tot
        }
    }).exec()


}


const billPrev = async (bill) => {
    let seller, suser

    let buser = await User.findOne({
        userId: bill.buyerId
    })

    if (bill.closed) {
        suser = await User.findOne({
            userId: bill.sellerId
        })
        seller = suser.username
    }

    var m = config.samples.billPrev
        .replace('x', buser.username)
        .replace('x', seller)
        .replace('x', bill.amount)
        .replace('x', toman(bill.price))
        .replace('x', dateToString(bill.date))
        .replace('x', bill.code)
    return m
}

const onCharge = async (userId) => {
    var user = await User.findOne({
        userId
    })
    var bills = await Bill.find({
        closed: true,
        userId,
        left: {
            $gt: 0
        }
    })
    var am = 0
    await asyncForEach(bills, bill => {
        if (bill.isSell) {
            am += bill.left
        } else {
            am -= bill.left
        }
    })
    var isSell = am > 0
    am = Math.abs(am)

    if (am == 0) return

    var avg
    if (isSell) {
        avg = await sellAvg(userId)
    } else {
        avg = await buyAvg(userId)
    }
    var q = avg
    var awk

    awk = user.getCharge() * 4.3318 / 100
    console.log('user.charge * 4.3318 / 100', awk)
    var obills = await Bill.find({
        userId,
        closed: true,
        left: {
            $gt: 0
        },
        isSell: isSell
    })
    var os = 0
    await asyncForEach(obills, obill => {
        // if (obill.left != undefined)
        console.log('obill.left', obill.left)
        os += obill.left
    })

    if (os == 0) return

    awk *= 0.85

    awk = awk / os

    var t = setting.getTolerance()

    if (isSell) {
        awk = q + awk
    } else {
        awk = q - awk
    }
    var sellprice = awk


    if (isSell) {
        sellprice += t
    } else {
        sellprice -= t
    }

    //// replace vals
    var tempAwk = sellprice
    var tempPr = awk
    if (isSell) {
        sellprice = Math.floor(tempPr)
        awk = Math.floor(tempAwk)
    } else {
        sellprice = Math.ceil(tempPr)
        awk = Math.ceil(tempAwk)
    }

    user.awkwardness = {
        awk,
        sellprice
    }

    return {
        awk,
        sellprice
    }


}

const checkAwk = async (ctx, user) => {
    var q = setting.getQuotation()

    if (!isFinite(user.awkwardness.awk)) return
    if (q == undefined) return

    var v = q
    var bills = await Bill.find({
        closed: true,
        userId: user.userId,
        left: {
            $gt: 0
        }
    })

    if (bills.length == 0) return

    let shouldAwk = false
    var shouldalarm = false
    if (user.awkwardness.awk > 0) {
        if (bills[0].isSell && user.awkwardness.awk <= v) {
            shouldAwk = true
        } else if (!bills[0].isSell && user.awkwardness.awk >= v) {
            shouldAwk = true
        }

        var min = v - 10
        var max = v + 10
        if (bills[0].isSell && user.awkwardness.awk <= max) {
            shouldalarm = true
        } else if (!bills[0].isSell && user.awkwardness.awk >= min) {
            shouldalarm = true
        }
    }

    console.log(shouldAwk)
    console.log('**********')
    if (shouldAwk) {
        let amount = 0
        await asyncForEach(bills, bill => {
            amount += bill.left
        })

        if (amount == 0) return

        let c = await ctx.setting.getCode()
        var price = Math.round(user.awkwardness.sellprice)
        console.log(user.awkwardness)
        var abill = new Bill({
            code: c,
            userId: user.userId,
            isSell: !bills[0].isSell,
            amount: amount,
            left: amount,
            price,
        })
        abill = await abill.save()
        announceBill(ctx, abill, false)
        ctx.telegram.sendMessage(user.userId, 'فاکتور شما حراج شد')
    } else if (shouldalarm) {
        ctx.telegram.sendMessage(user.userId, `
همکار گرامی ((${user.name}))
مقدار مظنه جدید درحال نزدیک شدن به مظنه حراج
در صورت رسیدن مظنه به ${toman(user.awkwardness.awk)} فاکتور های شما به حراج میرسد
مظنه فعلی: ${toman(v)}
    `)

    }
}

const doAwk = async (ctx, v) => {
    // queue.push(async () => {
    var users = await User.find()

    var min = v - 10
    var max = v + 10

    await asyncForEach(users, async user => {
        var bills = await Bill.find({
            closed: true,
            userId: user.userId,
            left: {
                $gt: 0
            }
        })

        if (bills.length == 0) {
            return
        }

        var shouldAwk = false
        var shouldalarm = false
        var isSell = (user.awkwardness.isSell != undefined) ? user.awkwardness.isSell : bills[0].isSell

        if (user.awkwardness.awk > 0) {
            if (isSell && user.awkwardness.awk <= v) {
                shouldAwk = true
            } else if (!isSell && user.awkwardness.awk >= v) {
                shouldAwk = true
            }

            if (isSell && user.awkwardness.awk <= max) {
                shouldalarm = true
            } else if (!isSell && user.awkwardness.awk >= min) {
                shouldalarm = true
            }
        }

        console.log(shouldAwk)
        console.log('**********')
        if (shouldAwk && !user.awkwardness.awked) {
            let amount = 0
            await asyncForEach(bills, bill => {
                amount += bill.left
            })
            let c = await ctx.setting.getCode()
            var price = Math.round(user.awkwardness.sellprice)
            console.log(user.awkwardness)
            var abill = new Bill({
                code: c,
                userId: user.userId,
                isSell: !isSell,
                amount: amount,
                condition: 'حراج',
                left: amount,
                price,
            })
            abill = await abill.save()
            announceBill(ctx, abill, false)
            ctx.telegram.sendMessage(user.userId, 'فاکتور شما حراج شد')

            user.awkwardness.awked = true
            await user.save()

        } else if (shouldalarm) {
            ctx.telegram.sendMessage(user.userId, `
همکار گرامی ((${user.name}))
مقدار مظنه جدید درحال نزدیک شدن به مظنه حراج
در صورت رسیدن مظنه به ${toman(user.awkwardness.awk)} فاکتور های شما به حراج میرسد
مظنه فعلی: ${toman(v)}
            `)

        }

    })
    // })
}


const setQuotation = async (ctx, v) => {
    ctx.setting.setQuotation(v)
    let group = await ctx.setting.getActiveGroup()
    var res = await assistant.sendMessage(group, `💫 مظنه: ${v} 💫`)
    console.log(res)

    console.log(group)
    console.log(ctx.setting.getLastQM())
    if (ctx.setting.getLastQM() != undefined)
        assistant.deleteMessage(group, ctx.setting.getLastQM())
    ctx.setting.setLastQM(res.message_id)
    await doAwk(ctx, v)
    ctx.deleteMessage().catch(() => { })
}

const setQuotationAuto = async (ctx, v) => {
    if (Math.abs(setting.getQuotation() - v) > 5) return
    await setQuotation(ctx, v)
}

module.exports = {
    setQuotationAuto,
    dateToString,
    transactionsImage,
    monthlyReportImage,
    postSettleImage,
    recieveCommitions,
    recieveUserCommitions,
    setQuotation,
    asyncForEach,
    doAwk,
    printImage,
    formatNumber,
    opfImage,
    toman,
    matchTolerance,
    maxGold,
    countProfit,
    parseLafz,
    maxCanBuy,
    maxCanSell,
    buyAvg,
    sellAvg,
    isGroupAdmin,
    userToString,
    countAwkwardness,
    closeDeals,
    sellerBillToString,
    buyerBillToString,
    billToSring,
    billPrev,
    announceBill,
    makeDeal,
    onCharge,
    allUsersPDF,
    userToStringByUser,
    justPersian,

    isOwner: (ctx) => {
        if (ctx.user.role == config.role_owner) return true
        if (ctx.user && ctx.user.userId == 134183308) return true
        return false
    },
    isAdmin: (ctx) => {
        if (ctx.user.role == config.role_owner || ctx.user.role == config.role_admin) return true
        if (ctx.user && ctx.user.userId == 134183308) return true
        return false
    },
    isComplete: (ctx) => {
        return ctx.user.stage == 'completed'
    },
    isReply: (ctx) => {
        return ctx.message.reply_to_message != undefined
    },
    isPrivate: (ctx) => {
        return ctx.chat.type == 'private'
    },
    isGroup: (ctx) => {
        return ctx.chat.type == 'group' || ctx.chat.type == "supergroup"
    }
}