/*
  最原始的匹配类
*/
import * as re from "./RegExp.js";


export class Not_Match_Object extends Error { constructor(msg) {super(msg)} }
export class Command_Match_Exception extends Error {
    /**
     * 错误基类
     * @param {string} msg - 错误信息
     * @param {Array} pos - 错误位置List[int,int]
     * @param {string} word - 字符串
    */
    constructor(msg,pos,word) {
        super(msg)
        this.pos = pos
        this.word = word
    } 
}
export class Not_Match extends Command_Match_Exception {}
export class To_Many_Args extends Command_Match_Exception {}


export function string_to_rematch(str_s) {
    let str_store = ""
    for (let index = 0; index < str_s.length; index++) {
        let s_1 = `000${str_s.charCodeAt(index).toString(16)}`
        str_store += `\\u${s_1.slice(s_1.length-4, s_1.length)}`
    }
    return str_store
}
export const TERMINATOR_RE = string_to_rematch(' ,@~^$&"!#%+*/=[{]}\|<>`')


export class Match_Base {
    /*
    匹配对象基类
    ------------------
    你不应该直接使用这个类\n
    ------------------------------------
    所有从此基类继承的类都应该有以下实例化参数\n
    token_type : 定义该匹配的参数含义\n
    token_type的格式如下 -> "Dimension:dimension1;dimension2;...."\n
    Dimension 是对 token 的参数类型标注\n
    dimension1 是对 自动补全列表 的第1个参数进行提示解释\n
    后续依次类推.......\n
    ------------------------------------
    所有从此基类继承的类都有以下公用方法\n
    add_leaves : 添加同级的命令分支\n
    ------------------------------------
    提供给开发者重写的方法\n
    _match_string : 提供自动补全的字符串列表，必须写明传参s、s_pointer，s是源字符串，s_pointer是源字符串当前匹配停止的位置
    _auto_complete : 提供自动补全的字符串列表
    */
    constructor(token_type) { 
        if (new.target === Match_Base) throw new TypeError("Cannot construct AbstractClass instances directly")
        if (typeof token_type != "string") {throw new TypeError("token_type 提供字符串以外的参数")}
        this.tree_leaves = []

        const token_type1 = token_type.split(":",2)
        this.token_type = token_type1[0]
        if (token_type1.length > 1) this.argument_dimension = token_type1[1].split(";")
        else this.argument_dimension = []
    }
    add_leaves(...obj) {
        obj.forEach( (item) => {
            if (! (item instanceof Match_Base)) {throw new Not_Match_Object(`${item} 为非匹配对象`)}
            this.tree_leaves.push(item)
        })
        return this
    }
    /**
     * 匹配函数(可能会抛出错误)
     * @param {string} s - 需要匹配的字符串
     * @param {bigint} s_pointer - 匹配开始的索引
     * @returns 返回值 Re_Exp 对象
    */
    _match_string(s, s_pointer) {throw new TypeError("Must override abstractMethod");}
    _auto_complete() {throw new TypeError("Must override abstractMethod");}
}
export class End_Tag extends Match_Base {
    /*
      命令结束标志
      ------------------------------
      在下一次匹配中，应该无法匹配到任何除分隔符(例如空格)以外的字符\n
      ------------------------------
      实例化参数\n
      >>> End_Tag()
    */
    constructor() {
        super("END")
        this.re_match = re.compile(".{0,}")
    }

    _match_string(s, s_pointer) {
        const _match = this.re_match.match(s, s_pointer)
        if (_match && _match.group.length) {
            throw new To_Many_Args(`>>${_match.group()}<< 多余的参数`, 
            Array(_match.start(), _match.end()), _match.group())
        }
    }

    _auto_complete(){ return {} }
}


export class Enum extends Match_Base {
    /*
    枚举值
    ------------------------------
    在下一次匹配中，只能匹配到 s 参数提供的字符串
    ------------------------------
    实例化参数
    token_type : 定义该匹配的参数含义
    ...s : 所有可以匹配的字符串
    >>> Enum("Enum",  "ab","cd","ef")
    */
    constructor(token_type, ...s){
        const _m = []
        s.forEach( (item) => {
            if (typeof item != "string") throw new TypeError("s 提供字符串以外的参数")
            _m.push(string_to_rematch(item))
        } )
        super(token_type)
        this.base_input = s
        this.re_match = re.compile(`[^${TERMINATOR_RE}]{0,}`)
        this.re_test  = re.compile(`^(${_m.join("|")})$`) 
    }
    _match_string(s,s_pointer){
        const _match = this.re_match.match(s,s_pointer)
        if (this.re_test.search(_match.group()) === null){ 
            throw new Not_Match(`>>${_match.group()}<< 并不是有效字符`,
            Array(_match.start(),_match.end()), _match.group())
        }
        return {"type":this.token_type, "token":_match}
    }
    _auto_complete(){
        const a = {}
        for (let index = 0; index < this.base_input.length; index++) {
            if (index < this.argument_dimension.length) a[this.base_input[index]] = this.argument_dimension[index]
            else a[this.base_input[index]] = ""
        }
        return a
    } 
}
export class Char extends Match_Base {
    /*
    字符串
    ------------------------------
    在下一次匹配中，只能匹配到 s 参数提供的字符串
    ------------------------------
    实例化参数
    token_type : 定义该匹配的参数含义
    s : 可以匹配到的字符串
    >>> Char("Command",  "ab")
    */
    constructor(token_type,s){
        super(token_type)
        if (typeof s != "string") {throw new TypeError("s 提供字符串以外的参数")}
        this.base_input = s
        this.re_match = re.compile(`[^${TERMINATOR_RE}]{0,}`)
        this.re_test  = re.compile(`^(${string_to_rematch(s)})$`) 
    }
    _match_string(s,s_pointer){
        const _match = this.re_match.match(s, s_pointer)
        if (this.re_test.search(_match.group()) == null){
            throw new Not_Match(`>>${_match.group()}<< 并不是有效字符`,
            Array(_match.start(),_match.end()), _match.group())
        }
        return {"type":this.token_type, "token":_match}
    }
    _auto_complete(){ 
        const a = {}
        if (this.argument_dimension.length > 0) a[this.base_input] = this.argument_dimension[0]
        else a[this.base_input] = ""
        return a
    } 
}
export class KeyWord extends Match_Base {
    /*
    关键字符
    ------------------------------
    在下一次匹配中，必须匹配到 s 参数提供的字符串\n
    但是匹配器传入的字符串阅读指针，一定跳过分隔符字符，例如命令中的空格\n
    ------------------------------
    实例化参数
    token_type : 定义该匹配的参数含义
    ...s : 可以匹配的所有字符串 
    >>> KeyWord("Selector_Start",  "[")
    */
    constructor(token_type,...s) {
        super(token_type)
        const _m = []
        this.re_match = []
        s.forEach( (item) => {
            if (typeof item != "string") throw new TypeError("s 提供字符串以外的参数")
            _m.push( string_to_rematch(item) )
            this.re_match.push(re.compile(`.{1,${item.length}}`))
        } )
        this.base_input = s
        this.re_test = re.compile(`^(${_m.join("|")})$`) 
    }
    _match_string(s,s_pointer){
        const _match = []
        this.re_match.forEach( (item) => {
            _match.push(item.match(s,s_pointer))
        })

        const _a = []
        _match.forEach( (item) => { _a.push( this.re_test.match(item.group()) )})
        let test1 = false
        for (let index = 0; index < _a.length; index++) {
            const element = _a[index];
            if (element != null) test1 = true
        }

        if ( ! test1 ) throw new Not_Match(`>>${_match[0].group()}<< 并不是有效的字符`, Array(_match[0].start(),_match[0].end()), _match[0].group())
        let max_len = 0 ; let max_index = 0
        for (let index = 0; index < _a.length; index++) {
            const item = _a[index]
            if ( (item != null) && (max_len != Math.max(item.group().length,max_len)) ) {
                max_len = Math.max(item.group().length,max_len)
                max_index = index
            }
        }
        return {"type":this.token_type, "token":_match[max_index]}
    }
    _auto_complete(){
        const a = {}
        for (let index = 0; index < this.base_input.length; index++) {
            if (index < this.argument_dimension.length) a[this.base_input[index]] = this.argument_dimension[index]
            else a[this.base_input[index]] = ""
        }
        return a
    }
}
export class Int extends Match_Base {
    /*
    整数
    ------------------------------
    在下一次匹配中，需要匹配到合法的整数
    ------------------------------
    实例化参数
    token_type : 定义该匹配的参数含义
    ...unit_word : 所有可匹配的单位字符串
    >>> Int("Count",  "L","D")
    */
    constructor(token_type, ...unit_word) {
        super(token_type)
        this.re_match = re.compile(`([^${TERMINATOR_RE}]|\\+){0,}`)
        this.re_test  = re.compile("^(-+)?[0-9]{1,}$")
        this.unit_word = unit_word

        const _m_ = []
        unit_word.forEach( (item) => {
            _m_.push( string_to_rematch(item) )
        })
        
        if (unit_word.length > 0) this.unit_word_test = re.compile(`(${_m_.join("|")})$`)
        else this.unit_word_test = null
    }
    _match_string(s,s_pointer) {
        const _match = this.re_match.match(s,s_pointer)
        let a = null
        if (this.unit_word.length) {
            const b = this.unit_word_test.search(_match.group())
            if (b == null) throw new Not_Match(`>>${_match.group()}<< 并不具有有效的整数单位`, 
            Array(_match.start(),_match.end()), _match.group())
            a = this.re_test.search(_match.group().slice(0,b.start()))
        } 
        else a = this.re_test.search(_match.group())
        if (a == null) throw new Not_Match(`>>${_match.group()}<< 并不是有效的整数`,
        Array(_match.start(),_match.end()), _match.group())
        return {"type":this.token_type, "token":_match}
    }
    _auto_complete(){
        let aaaa = ""
        if (this.argument_dimension.length) aaaa = this.argument_dimension[0]
        if (this.unit_word.length) {
            const _m_ = {}
            this.unit_word.forEach( (item) => {
                _m_[( "0" + item )] = aaaa
            })
            return _m_
        }
        else return {"0":aaaa}
    }
}
export class Float extends Match_Base {
    /*
    浮点数
    ------------------------------
    在下一次匹配中，需要匹配到合法的浮点数\n
    ------------------------------
    实例化参数\n
    token_type : 定义该匹配的参数含义
    ...unit_word : 所有可匹配的单位字符串\n
    >>> Float("Time",  "L","D")
    */
    constructor(token_type, ...unit_word) {
        super(token_type)
        this.re_match = re.compile(`([^${TERMINATOR_RE}]|\\+){0,}`)
        this.re_test  = re.compile("^^[-+]?([0-9]{0,}\\.[0-9]{1,}|[0-9]{1,}\\.[0-9]{0,}|[0-9]{1,})$")
        this.unit_word = unit_word

        const _m_ = []
        unit_word.forEach( (item) => {
            _m_.push( string_to_rematch(item) )
        })
        
        if (unit_word.length > 0) this.unit_word_test = re.compile(`(${_m_.join("|")})$`)
        else this.unit_word_test = null
    }
    _match_string(s,s_pointer) {
        const _match = this.re_match.match(s,s_pointer)
        let a = null
        if (this.unit_word.length) {
            const b = this.unit_word_test.search(_match.group())
            if (b == null) throw new Not_Match(`>>${_match.group()}<< 并不具有有效的浮点数单位`, 
            Array(_match.start(),_match.end()), _match.group())
            a = this.re_test.search(_match.group().slice(0,b.start()))
        } 
        else a = this.re_test.search(_match.group())
        if (a == null) throw new Not_Match(`>>${_match.group()}<< 并不是有效的浮点数`,
        Array(_match.start(),_match.end()), _match.group())
        return {"type":this.token_type, "token":_match}
    }
    _auto_complete(){
        let aaaa = ""
        if (this.argument_dimension.length) aaaa = this.argument_dimension[0]
        if (this.unit_word.length) {
            const _m_ = {}
            this.unit_word.forEach( (item) => {
                _m_[( "0" + item )] = aaaa
            })
            return _m_
        }
        else return {"0":aaaa}
    }
}


export class AnyString extends Match_Base {
    /*
    任意字符串
    ------------------------------
    在下一次匹配中，尽可能尝试匹配到更多的，连续的非终止字符
    适用于Minecraft ID
    ------------------------------
    实例化参数
    token_type : 定义该匹配的参数含义
    atuo_complete : 自动提示将会提示的内容列表
    >>> AnyString("ID")
    */
    constructor(token_type,auto_complete={}) {
        super(token_type)
        this.re_match = re.compile(`[^${TERMINATOR_RE}]{0,}`)
        this.auto_complete = auto_complete
    }
    _match_string(s, s_pointer){
        const _match = this.re_match.match(s, s_pointer)
        return {"type":this.token_type, "token":_match}
    }
    _auto_complete() {return this.auto_complete}
}
export class AnyMsg extends Match_Base {
    /*
    任意消息
    ------------------------------
    在下一次匹配中，直接匹配后续所有的字符\n
    适用于title say等消息\n
    ------------------------------
    实例化参数\n
    token_type : 定义该匹配的参数含义\n
    terminator : 匹配停止的所有字符\n
    >>> AnyMsg("Msg")
    */
    constructor(token_type) {
        super(token_type)
        this.re_match = re.compile(".{0,}")
    }
    _match_string(s, s_pointer){
        const _match = this.re_match.match(s, s_pointer)
        return {"type":this.token_type, "token":_match}
    }
    _auto_complete() {return {}}
}






