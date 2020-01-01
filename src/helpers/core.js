const {
    dateToString
} = require('./date')

const setting = require('../model/Setting')
const Bill = require('../model/Bill')


async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

const toman = (v) => {
        if (v == undefined) v = 0
        return formatNumber(Math.round(v * 10) * 100)
    },
    formatNumber = (v) => {
        return v.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
    }

const matchTolerance = (price) => {
    var tol = setting.getTolerance()
    var q = setting.getQuotation()
    var min = q - tol
    var max = q + tol
    return (price >= min && price <= max)
}
const maxGold = async (ctx) => {
    let bc = await ctx.setting.getBaseCharge()
    return Math.floor(ctx.user.charge / bc)
}

const countProfit = (buyPrice, sellPrice) => {
    let diff = sellPrice - buyPrice
    return diff * 23.08
}
const parseLafz = l => {
    let a, b, isSell
    isSell = l.includes('ف')
    if (isSell) {
        [a, b] = l.split('ف')
    } else {
        [a, b] = l.split('خ')
    }
    let q = setting.getQuotation().toString()
    if ((q.length - b.length) == 1) {
        b = q[0] + b
    }
    a = +a
    b = +b
    return [a, isSell, b]
}

const maxCanBuy = async (ctx,closed = true) => {

    console.log('mcb')
    let bc = ctx.user.config.baseCharge == -1 ? ctx.setting.getBaseCharge() : ctx.user.config.baseCharge
    console.log(bc)
    let mx = Math.floor(ctx.user.charge / bc)
    mx = mx > 10 ? 10 : mx
    console.log(mx)
    var query = {
        settled: false,
        expired: false,
        userId: ctx.user.userId,
        isSell: false,
        left: {
            $gt: 0
        }
    }
    if(closed) query.closed = true
    let bills = await Bill.find({...query})
    let am = 0


    while (bills.length > 0) {
        var bill = bills.pop()
        am += bill.left
    }

    console.log(am)
    mx -= am

    if (mx < 0) mx = 0
    return mx
}
const maxCanSell = async (ctx,closed = true) => {
    console.log('mcs')
    let bc = ctx.user.config.baseCharge == -1 ? ctx.setting.getBaseCharge() : ctx.user.config.baseCharge
    console.log(bc)
    let mx = Math.floor(ctx.user.charge / bc)
    mx = mx > 10 ? 10 : mx
    console.log(mx)
    var query = {
        expired: false,
        settled: false,
        userId: ctx.user.userId,
        isSell: true,
        left: {
            $gt: 0
        }
    }
    if(closed) query.closed = true
    let bills = await Bill.find({...query})
    let am = 0
    
    while (bills.length > 0) {
        var bill = bills.pop()
        am += bill.left
    }
    
    console.log(am)
    mx -= am
    if (mx < 0) mx = 0
    return mx
}
const buyAvg = async (userId) => {
    let mgs = await Bill.find({
        userId,
        closed: true,
        isSell: false,
        left: {
            $gt: 0
        }
    })

    let avg = 0
    if (mgs.length > 0) {
        let sum = 0
        let am = 0
        await asyncForEach(mgs, mg => {
            sum += mg.price * mg.left //don't forget to add the base
            am += mg.left
        })
        avg = sum / am
    }
    return avg
}
const sellAvg = async (userId) => {
    let mgs = await Bill.find({
        closed: true,
        userId,
        isSell: true,
        left: {
            $gt: 0
        }
    })

    let avg = 0
    if (mgs.length > 0) {
        let sum = 0
        let am = 0
        await asyncForEach(mgs, mg => {
            sum += mg.price * mg.left //don't forget to add the base
            am += mg.left
        })
        avg = sum / am
    }
    return avg
}

module.exports = {
    dateToString,
    asyncForEach,
    toman,
    matchTolerance,
    formatNumber,
    maxGold,
    countProfit,
    parseLafz,
    maxCanBuy,
    maxCanSell,
    buyAvg,
    sellAvg
}