class Match {
    
  /**
  * Match对象
  * @param {string} string - 字符串
  * @param {int} start_pos - 开始的位置
  * @returns 返回值 Match对象 | null
  */
  constructor(string,start_pos) {
    this._group = string
    this._start = start_pos
    this._end = start_pos + this._group.length
  }
  group(){ return this._group }
  start(){ return this._start_pos }
  end(){ return this._end }
}

class Re_Exp {

  constructor(partten_string,flag_string="g") {
    this.re_object = new RegExp(partten_string,flag_string)
  }

  /**
   * match方法从字符串pos位置开始匹配，如果pos开始的字符串不满足规则，返回null
   * @param {string} string - 匹配需要的字符串
   * @param {string} pos - 匹配开始的位置
   * @returns 返回值 Match对象 | null
  */
  match(string,pos=0){
    this.re_object.lastIndex = pos
    const a = this.re_object.exec(string)
    if (a === null) return null
    if (a["index"] === pos) return new Match(a["0"],a["index"])
    else return null
  }

  /**
   * match方法从字符串pos位置开始匹配，如果后续所有的字符串不满足规则，返回null
   * @param {string} string - 匹配需要的字符串
   * @param {string} pos - 匹配开始的位置
   * @returns 返回值 Match对象 | null
  */
  search(string,pos=0){
    this.re_object.lastIndex = pos
    const a = this.re_object.exec(string)
    if (a === null) return null
    else return new Match(a["0"],a["index"])
  }
}


/**
 * 正则表达式编译函数
 * @param {string} string - 正则表达式字符串
 * @param {string} flag - 正则表达式标注符号
 * @returns 返回值 Re_Exp 对象
*/
export function compile(string,flag="g"){return new Re_Exp(string,flag)}





