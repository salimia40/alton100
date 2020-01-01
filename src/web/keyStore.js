const uuid = require('uuid')

function Code(userId, code, onExpire = () => {}) {
    this.userId = userId
    this.c = code
    this.isValid = true
    this.onExpire = onExpire
    this.inValidate = function () {
        if (this.isValid) {
            this.isValid = false
            this.onExpire(this)
        }
    }
    setTimeout(this.inValidate, 10 * 60 * 1000)
}

function CodeManager() {
    this.codes = new Map([])
    this.remove = function (c) {
        this.codes.delete(c)
        return true
    }
    /**
     * generates and saves code for given userId 
     * @param userId
     * @returns key:String
     */
    this.genCode = function (userId) {
        var self = this
        // avoid making duplicate codes per userId
        for(var pCode in this.codes) {
            if(pCode.userId == userId){
                pCode.inValidate()
                break
            }
        }
        var key = uuid().replace(/-/g, '')
        var code = new Code(
            userId,
            key,
            function (code) {
                self.remove(code.c)
            })

        this.codes.set(key, code)
        return key
    }
    /**
     * find userId for given code
     * @param key
     * @returns userId:String or false
     */
    this.readCode = function (c) {
        if (this.codes.has(c)) {
            var code = this.codes.get(c)
            code.inValidate()
            return code.userId
        } else return false
    }
}

module.exports = new CodeManager()