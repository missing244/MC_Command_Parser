/*
命令词法器系统
class Command_Parser
*/

import * as re from "./RegExp.js";
import * as BaseMatch from "./base_match_class.js";
import * as SpecialMatch from "./special_match.js";

function isinstance(object,_class) {return (object instanceof _class)}


export class Command_Parser {
    /*
    词法器
    ------------------------
    实例化参数
    Tree : SpecialMatch.Command_Root类开始嵌套的命令树
    separator : 一个分隔字符
    separator_count : 每段匹配机构之间需要需要相隔多少分隔符
    */

    constructor(Tree, separator=" ", separator_count=null) {
        if (! isinstance(Tree,SpecialMatch.Command_Root)) throw new TypeError("Tree 参数只能为 SpecialMatch.Command_Root 类")

        if (typeof separator != "string") throw new TypeError("separator 参数只能为字符串")
        if (separator.length != 1) throw new Exception("separator 参数应该只存在一个字符")

        if ( (separator_count != null) && (typeof separator != "number") ) throw new TypeError("separator_count 参数只能为null或者整数")
        if ( (typeof separator == "number") && separator_count < 1 ) throw new Exception("separator_count 参数应该为正整数")
        
        this.Tree = Tree
        this.separator = separator
        this.separator_count = separator_count
        if (separator_count == null) this.separator_re_match = re.compile(`[${BaseMatch.string_to_rematch(separator)}]{0,}`)
        else this.separator_re_match = re.compile(`[${BaseMatch.string_to_rematch(separator)}]{${separator_count},${separator_count}}`)
        this.no_match_error1 = re.compile(`[^${BaseMatch.TERMINATOR_RE}]{1,}`)
        this.no_match_error2 = re.compile(".{0,1}")

        this.current_leaves = Tree
    }
    reset_parser_tree() {this.current_leaves = this.Tree}
    _jump_space(s, s_pointer) { return this.separator_re_match.match(s,s_pointer) }
    _get_auto_complete(e) {
        let _str = []
        for (let index = 0; index < this.current_leaves.tree_leaves.length; index++) {
            const element = this.current_leaves.tree_leaves[index];
            _str = _str.concat( element._auto_complete() )
        }

        const s_list = []
        const re_match = re.compile(BaseMatch.string_to_rematch(e.word))
        _str.forEach( (item) => {
            const a = re_match.search(item)
            if (a != null) s_list.push([a.start(),item])
        } )
        s_list.sort()

        const return_list = []
        s_list.forEach( (item) => { return_list.push(item[1]) } )
        return return_list
    }
    _parser(command_str){ 
        let command_str_pointer = 0 ; let Token_list = []
        this.Token_list = Token_list

        while (1) {
            if (this.current_leaves.tree_leaves.length == 0) break

            let is_not_successs = true
            for (let index = 0; index < this.current_leaves.tree_leaves.length; index++) {
                const i = this.current_leaves.tree_leaves[index];
                try { 
                    const a = i._match_string(command_str,command_str_pointer)
                    is_not_successs = false
                    this.current_leaves = i
                    if ( isinstance(i,BaseMatch.End_Tag) ) break
                    command_str_pointer = a.end()
                    Token_list.push(a)
                    break
                }
                catch (e) {}//console.log(e);}
                
            }
            //if (!is_not_successs) console.log([command_str_pointer,Token_list[Token_list.length-1]])
            if (is_not_successs) {
                let _m_ = this.no_match_error1.match(command_str,command_str_pointer)
                if (_m_ == null) _m_ = this.no_match_error2.match(command_str,command_str_pointer)
                throw new BaseMatch.Not_Match(`>>${_m_.group()}<< 非期望的参数`,
                Array(_m_.start(),_m_.end()), _m_.group())
            }
            if ( isinstance(this.current_leaves,BaseMatch.End_Tag) ) break
            command_str_pointer = this._jump_space(command_str,command_str_pointer).end()
        }
        return Token_list
    }
    parser(command_str) {
        this.reset_parser_tree()
        try {const a = this._parser(command_str) ; return a}
        catch (e) { return [e,this._get_auto_complete(e)] }
    }
}











