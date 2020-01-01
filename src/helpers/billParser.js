const User = require('../model/User')
const Bill = require('../model/Bill')
const {
    dateToString,
    toman,
    buyAvg,
    sellAvg
} = require('./core')


const sellerBillToString = async (bill, result) => {
    let {
        totalCommition,
        totalProfit,
    } = result


    let user = await User.findOne({
        userId: bill.userId
    })


    let sopfs = await Bill.find({
        userId: bill.userId,
        closed: true,
        left: {
            $gt: 0
        },
        isSell: true
    })

    let bopfs = await Bill.find({
        userId: bill.userId,
        closed: true,
        left: {
            $gt: 0
        },
        isSell: false
    })

    let avg = await sellAvg(bill.userId)
    let bavg = await buyAvg(bill.userId)

    let final = totalProfit - totalCommition
    let ft = ''
    if (final < 0) {
        ft = 'ضرر'
        final = Math.abs(final)
    } else
        ft = 'سود'

    let msg = `
👤 معامله گر گرامی ${user.name}
            
مقدار 🔴 فروش  : ${bill.amount} واحد به قیمت : ${toman(bill.price)}
            
📈 سود یا ضرر شما: ${toman(final)+ ' ' + ft}`

    let ops = 0
    if (bopfs.length > 0) {
        bopfs.forEach(v => {
            ops += v.left
        })
        msg += `

⭕️ شما تعداد ${ops} واحد فاکتور باز خرید دارید.`

        msg += `
        
⭕️ میانگین فاکتور خرید: ${toman(bavg)}
            
⭕️ چناچه قیمت مظنه به : ${toman(bill.awkwardness.awk)} برسد 
            
📣 فاکتور خرید شما به قیمت: ${toman(bill.awkwardness.sellprice)} حراج می شود. `
    } else if (sopfs.length > 0) {
        sopfs.forEach(v => {
            ops += v.left
        })
        msg += `

⭕️ شما تعداد ${ops} واحد فاکتور باز فروش دارید.`
        msg += `
            
⭕️ میانگین فاکتور فروش: ${toman(avg)}
                
⭕️ چناچه قیمت مظنه به : ${toman(bill.awkwardness.awk)} برسد 
                
📣 فاکتور فروش شما به قیمت: ${toman(bill.awkwardness.sellprice)} حراج می شود. `
        
    } else {
        msg += `

⭕️ معاملات شما بسته شد و در حال حاضر فاکتور بازی ندارید`
    }

    msg += `
        
💶 موجودی شما برابر است با : ${toman(user.charge)}`
    return msg

}


const buyerBillToString = async (bill, result) => {
    let {
        totalCommition,
        totalProfit
    } = result


    let user = await User.findOne({
        userId: bill.userId
    })


    let sopfs = await Bill.find({
        userId: bill.userId,
        closed: true,
        left: {
            $gt: 0
        },
        isSell: true
    })

    let bopfs = await Bill.find({
        userId: bill.userId,
        closed: true,
        left: {
            $gt: 0
        },
        isSell: false
    })

    let avg = await buyAvg(bill.userId)
    let savg = await sellAvg(bill.userId)

    let final = totalProfit - totalCommition
    let ft = ''
    if (final < 0) {
        ft = 'ضرر'
        final = Math.abs(final)
    } else
        ft = 'سود'


    let msg = `
👤 معامله گر گرامی ${user.name}
            
مقدار 🔵 خرید  : ${bill.amount} واحد به قیمت : ${toman(bill.price)}
            
📈 سود یا ضرر شما: ${toman(final)+ ' ' + ft}`

    let ops = 0
    if (sopfs.length > 0) {
        sopfs.forEach(v => {
            ops += v.left
        })
        msg += `

⭕️ شما تعداد ${ops} واحد فاکتور باز فروش دارید.`
        msg += `
            
⭕️ میانگین فاکتور فروش: ${toman(savg)}
                
⭕️ چناچه قیمت مظنه به : ${toman(bill.awkwardness.awk)} برسد 
                
📣 فاکتور فروش شما به قیمت: ${toman(bill.awkwardness.sellprice)} حراج می شود. `

    } else if (bopfs.length > 0) {
        bopfs.forEach(v => {
            ops += v.left
        })
        msg += `

⭕️ شما تعداد ${ops} واحد فاکتور باز خرید دارید.`
        msg += `
        
⭕️ میانگین فاکتور خرید: ${toman(avg)}
            
⭕️ چناچه قیمت مظنه به : ${toman(bill.awkwardness.awk)} برسد 
            
📣 فاکتور خرید شما به قیمت: ${toman(bill.awkwardness.sellprice)} حراج می شود. `
        
    } else {
        msg += `

⭕️ معاملات شما بسته شد و در حال حاضر فاکتور بازی ندارید`
    }

    msg += `
        
        💶 موجودی شما برابر است با : ${toman(user.charge)}`
    return msg

}



const billToSring = async (bill, result) => {
    let res
    if (bill.isSell)
        res = await sellerBillToString(bill, result)
    else res = buyerBillToString(bill, result)
    return res

}

module.exports = {
    billToSring,
    buyerBillToString,
    sellerBillToString
}