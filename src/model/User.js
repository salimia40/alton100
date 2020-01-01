const mongoose = require("./_db");
const Schema = mongoose.Schema;

const userSchema = new Schema({
    stage: {
        type: String,
        default: 'justJoined'
    },
    role: {
        type: String,
        default: 'bot-member'
    },
    username: String,
    charge: {
        type: Number,
        default: 0
    },
    docs: [String],
    userId: {
        type: Number,
        required: true
    },
    block: {
        value: {
            type: Number,
            default: 0
        },
        isSell: {
            type: Boolean,
            default: true
        },
    },
    gift: {
        req: {
            type: Number,
            default: 0
        },
        charge: {
            type: Number,
            default: 0
        },
        activated: {
            type: Boolean,
            default: true
        }
    },
    phone: String,
    state: String,
    name: String,
    awkwardness: {
        awk: Number,
        sellprice: Number,
        awked : {
            type: Boolean,
            default: false
        },
        isSell : {
            type: Boolean,
            default: false
        },
    },
    bank: {
        name: String,
        number: String
    },
    invites: [Number],
    invite : {
        inviter: Number,
        asked: {
            type: Boolean,
            default: false
        }
    },
    acceptedTerms: {
        type: Boolean,
        default: false
    },
    confirmed: {
        type: Boolean,
        default: false
    },
    config: {
        baseCharge: {
            type: Number,
            default: -1
        },
        vipOff: {
            type: Number,
            default: -1
        }
    }
})

userSchema.methods.getCharge = function () {
    return (this.gift.charge != undefined) ?
        this.charge + this.gift.charge :
        this.charge
}

const User = mongoose.model("User", userSchema)

module.exports = User