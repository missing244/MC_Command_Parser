/*
针对 Minecraft 中特殊的结构内建的匹配类
*/

import * as re from "./RegExp.js";
import * as BaseMatch from "./base_match_class.js";

class Illegal_Match extends BaseMatch.Command_Match_Exception {}

export class Command_Root extends BaseMatch.Match_Base {
    /*
    命令根类
    ------------------
    命令应该由此类开始add_leaves\n
    */
    
    add_leaves(...obj){
        for (let index = 0; index < obj.length; index++) {
            if (! (obj[index] instanceof BaseMatch.Match_Base)) {
                throw new BaseMatch.Not_Match_Object("obj 不应该存在非 Match_Base 对象")
            }
        }
        this.tree_leaves.push(...obj)
        return this
    }
}

export class BE_Range_Int extends BaseMatch.Int {
    /*
    MCBE版范围整数匹配
    ------------------------------
    在下一次匹配中，只能匹配到范围整数\n
    ------------------------------
    实例化参数\n
    terminator : 匹配停止的所有字符\n
    >>> BE_Range_Int()
    */
    constructor(){
        super()
        this.re_match = re.compile(`[^${BaseMatch.TERMINATOR_RE}\\.]{0,}`)
    }
}
export class BE_String extends BaseMatch.Match_Base {
    /*
    MCBE版普通字符串匹配
    ------------------------------
    在下一次匹配中，只能匹配到非双引号开头的，非数字字符串\n
    ------------------------------
    实例化参数\n
    terminator : 匹配停止的所有字符\n
    >>> BE_String()
    */
    constructor(){
        super()
        this.re_match = re.compile(`[^${BaseMatch.TERMINATOR_RE}]{0,}`)
        this.re_test  = re.compile("^[-+]?([0-9]{0,}\\.[0-9]{1,}|[0-9]{1,}\\.[0-9]{0,}|[0-9]{1,})$") 
    }
    _match_string(s, s_pointer){
        const _match = this.re_match.match(s,s_pointer)
        if ( ( _match.group().length === 0 ) || ( this.re_test.search(_match.group()) != null ) ) { 
            throw new Illegal_Match(`>>${_match.group()}<< 并不是有效字符串`, 
            Array(_match.start(),_match.end()), _match.group())
        }
        return _match
    }
    _auto_complete(){ return ["string"] }
}
export class BE_Quotation_String extends BaseMatch.Match_Base {
    /*
    MCBE版引号字符串匹配
    ------------------------------
    在下一次匹配中，只能匹配到双引号开头的合法字符串\n
    ------------------------------
    >>> BE_Quotation_String()
    */
    constructor(){
        super()
        this.re_match = re.compile('"(\\\\.|[^\\\\"]){0,}"')
    }
    _match_string(s, s_pointer){
        const len_s = s.length
        if (s[s_pointer] != "\"") {
            throw new Illegal_Match(`>>${s[s_pointer]}<< 并不是有效的引号字符串`, 
            Array(s_pointer,s_pointer+1), s[s_pointer])
        }
        const _match = this.re_match.match(s,s_pointer)
        if (_match == null) {
            throw new Illegal_Match(`>>${s.slice(s_pointer, len_s)}<< 并不是有效的引号字符串`,
            Array(s_pointer,len_s), s.slice(s_pointer, len_s))
        }
        return _match
    }
    _auto_complete() { return ['"string"'] }
}
export class Relative_Offset_Float extends BaseMatch.Match_Base {
    /*
    绝对/相对坐标
    ------------------------------
    在下一次匹配中，需要匹配到合法的一个绝对/相对坐标\n
    ------------------------------
    >>> Relative_Offset_Float()
    */
    constructor(){
        super()
        this.re_match = re.compile("~[-\\+]?[0-9\\.]{0,}")
        this.re_test  = re.compile("^[-+]?([0-9]{0,}\\.[0-9]{1,}|[0-9]{1,}\\.[0-9]{0,}|[0-9]{1,})$")
    }
    _match_string(s,s_pointer) {
        const _match = this.re_match.match(s,s_pointer)
        if (_match == null) {
            throw new Illegal_Match(`>>${s[s_pointer]}<< 不合法的相对偏量`, 
            Array(s_pointer,s_pointer + 1), s[s_pointer])
        }
        if (_match.group().length > 1) {
            if (this.re_test.search(_match.group().slice(1)) == null ) {
                throw new Illegal_Match(`>>${_match.group().slice(1)}<< 并不是有效的浮点数`,
                Array(_match.start()+1,_match.end()), _match.group().slice(1))
            }
        }
        return _match
    }
    _auto_complete() { return ["~"] }
}
export class Local_Offset_Float extends BaseMatch.Match_Base {
    /*
    局部坐标
    ------------------------------
    在下一次匹配中，需要匹配到合法一个的局部坐标\n
    ------------------------------
    >>> Local_Offset_Float()
    */
    constructor(){
        super()
        this.re_match = re.compile("(\\^)[-\\+]?[0-9\\.]{0,}")
        this.re_test  = re.compile("^[-+]?([0-9]{0,}\\.[0-9]{1,}|[0-9]{1,}\\.[0-9]{0,}|[0-9]{1,})$")
    }
    _match_string(s,s_pointer) {
        const _match = this.re_match.match(s,s_pointer)
        if (_match == null) {
            throw new Illegal_Match(`>>${s[s_pointer]}<< 不合法的相对偏量`, 
            Array(s_pointer,s_pointer + 1), s[s_pointer])
        }
        if (_match.group().length > 1) {
            if (this.re_test.search(_match.group().slice(1)) == null ) {
                throw new Illegal_Match(`>>${_match.group().slice(1)}<< 并不是有效的浮点数`,
                Array(_match.start()+1, _match.end()), _match.group().slice(1))
            }
        }
        return _match
    }
    _auto_complete() { return ["^"] }
}


export function Pos_Tree(...end_node) {
    /*
    自动生成一个坐标匹配树\n
    *end_node : 添加下一级匹配类\n
    -------------------------------
    返回匹配列表，请将该列表传入add_leaves时添加解包操作
    */
    return [
        new BaseMatch.Float().add_leaves(
            new Relative_Offset_Float().add_leaves(
                new Relative_Offset_Float().add_leaves(...end_node),
                new BaseMatch.Float().add_leaves(...end_node),
            ),
            new BaseMatch.Float().add_leaves(
                new Relative_Offset_Float().add_leaves(...end_node),
                new BaseMatch.Float().add_leaves(...end_node),
            )
        ),
        new Relative_Offset_Float().add_leaves(
            new Relative_Offset_Float().add_leaves(
                new Relative_Offset_Float().add_leaves(...end_node),
                new BaseMatch.Float().add_leaves(...end_node),
            ),
            new BaseMatch.Float().add_leaves(
                new Relative_Offset_Float().add_leaves(...end_node),
                new BaseMatch.Float().add_leaves(...end_node),
            )
        ),
        new Local_Offset_Float().add_leaves(new Local_Offset_Float().add_leaves(new Local_Offset_Float().add_leaves(...end_node)))
    ]
}
export function Range_Tree(...end_node) {
    /*
    自动生成一个范围值匹配树\n
    *end_node : 添加下一级匹配类\n
    -------------------------------
    返回匹配列表，请将该列表传入add_leaves时添加解包操作
    */
    return [
        new BE_Range_Int().add_leaves( 
            new BaseMatch.KeyWord("..").add_leaves( 
                new BE_Range_Int().add_leaves(...end_node),
                ...end_node
            ),
            ...end_node
        ),
        new BaseMatch.KeyWord("..").add_leaves( 
            new BE_Range_Int().add_leaves(...end_node)
        ),
        new BaseMatch.KeyWord("!").add_leaves(
            new BE_Range_Int().add_leaves( 
                new BaseMatch.KeyWord("..").add_leaves( 
                    new BE_Range_Int().add_leaves(...end_node),
                    ...end_node
                ),
                ...end_node
            ),
            new BaseMatch.KeyWord("..").add_leaves( 
                new BE_Range_Int().add_leaves(...end_node)
            )
        )
    ]
}
export function BE_Selector_Tree(...end_node) {
    /*
    自动生成一个目标选择器选择器匹配树\n
    *end_node : 添加下一级匹配类\n
    -------------------------------
    返回匹配列表，请将该列表传入add_leaves时添加解包操作
    */

    function middle_scores_loop(...end_node) {
        const scores = [
            new BE_String(),
            new BE_Quotation_String()
        ]
        scores[0].add_leaves( new BaseMatch.KeyWord("=").add_leaves( ...Range_Tree(
            new BaseMatch.KeyWord(",").add_leaves(...scores),
            new BaseMatch.KeyWord("}").add_leaves(...end_node)
        )))
        scores[1].add_leaves( new BaseMatch.KeyWord("=").add_leaves( ...Range_Tree(
            new BaseMatch.KeyWord(",").add_leaves(...scores),
            new BaseMatch.KeyWord("}").add_leaves(...end_node)
        )))
        return new BaseMatch.KeyWord("{").add_leaves(...scores)
    }
    function middle_haspermission_loop(...end_node) {
        const haspermission1 = new BaseMatch.KeyWord("{")
        const haspermission2 = new BaseMatch.Enum("camera","movement")
        haspermission2.add_leaves( 
            new BaseMatch.KeyWord("=").add_leaves( 
                new BaseMatch.Enum("enabled","disabled").add_leaves( 
                    new BaseMatch.KeyWord(",").add_leaves(haspermission2),
                    new BaseMatch.KeyWord("}").add_leaves(...end_node)
                )
            )
        )
        return haspermission1.add_leaves(haspermission2)
    }
    function middle_hasitem_single_args_loop(...end_node) {
        const hasitem  = [
            new BaseMatch.Char("item"),
            new BaseMatch.Char("data"),
            new BaseMatch.Char("quantity"),
            new BaseMatch.Char("location"),
            new BaseMatch.Char("slot")
        ]
        hasitem[0].add_leaves( new BaseMatch.KeyWord("=").add_leaves( 
            new BaseMatch.AnyString().add_leaves( 
                new BaseMatch.KeyWord(",").add_leaves(...hasitem),
                new BaseMatch.KeyWord("}").add_leaves(...end_node)
            )
        ))
        hasitem[1].add_leaves( new BaseMatch.KeyWord("=").add_leaves( 
            new BaseMatch.Int().add_leaves( 
                new BaseMatch.KeyWord(",").add_leaves(...hasitem),
                new BaseMatch.KeyWord("}").add_leaves(...end_node)
            )
        ))
        hasitem[2].add_leaves( new BaseMatch.KeyWord("=").add_leaves( 
            ...Range_Tree( 
                new BaseMatch.KeyWord(",").add_leaves(...hasitem),
                new BaseMatch.KeyWord("}").add_leaves(...end_node)
            )
        ))
        hasitem[3].add_leaves( new BaseMatch.KeyWord("=").add_leaves( 
            new BaseMatch.Enum(
                "slot.weapon.mainhand","slot.weapon.offhand",
                "slot.armor.head","slot.armor.chest","slot.armor.legs","slot.armor.feet",
                "slot.enderchest","slot.hotbar","slot.inventory","slot.saddle","slot.armor",
                "slot.armor","slot.chest","slot.equippable"
            ).add_leaves( 
                new BaseMatch.KeyWord(",").add_leaves(...hasitem),
                new BaseMatch.KeyWord("}").add_leaves(...end_node)
            )
        ))
        hasitem[4].add_leaves( new BaseMatch.KeyWord("=").add_leaves( 
            ...Range_Tree( 
                new BaseMatch.KeyWord(",").add_leaves(...hasitem),
                new BaseMatch.KeyWord("}").add_leaves(...end_node)
            )
        ))
        return new BaseMatch.KeyWord("{").add_leaves(...hasitem)
    }
    function middle_hasitem_multiple_args_loop(...end_node) {
        const hasitem1 = new BaseMatch.KeyWord("[")
        const m1 = new BaseMatch.KeyWord(",")
        const hasitem2 = middle_hasitem_single_args_loop( 
            m1, new BaseMatch.KeyWord("]").add_leaves(...end_node)
        )
        m1.add_leaves(hasitem2)
        return hasitem1.add_leaves(hasitem2)
    }

    const Selector_Var2 = [
        new BaseMatch.Enum("x","y","z"),    // 0
        new BaseMatch.Enum("dx","dy","dz"), // 1
        new BaseMatch.Enum("r","rm"),       // 2
        new BaseMatch.Enum("rx","rxm"),     // 3
        new BaseMatch.Enum("ry","rym"),     // 4
        new BaseMatch.Char("l","lm"),       // 5
        new BaseMatch.Char("c"),            // 6
        new BaseMatch.Char("type"),         // 7
        new BaseMatch.Char("m"),            // 8
        new BaseMatch.Enum("tag","name","family"), // 9
        new BaseMatch.Char("scores"),       // 10
        new BaseMatch.Char("haspermission"),// 11
        new BaseMatch.Char("hasitem")       // 12
    ]


    Selector_Var2[0].add_leaves( new BaseMatch.KeyWord("=").add_leaves( new Relative_Offset_Float().add_leaves(
            new BaseMatch.KeyWord(",").add_leaves(...Selector_Var2),
            new BaseMatch.KeyWord("]").add_leaves(...end_node)
        ),
    ))
    Selector_Var2[1].add_leaves( new BaseMatch.KeyWord("=").add_leaves( new BaseMatch.Float().add_leaves(
        new BaseMatch.KeyWord(",").add_leaves(...Selector_Var2),
        new BaseMatch.KeyWord("]").add_leaves(...end_node)
    )))
    Selector_Var2[2].add_leaves( new BaseMatch.KeyWord("=").add_leaves( new BaseMatch.Float().add_leaves(
        new BaseMatch.KeyWord(",").add_leaves(...Selector_Var2),
        new BaseMatch.KeyWord("]").add_leaves(...end_node)
    )))
    Selector_Var2[3].add_leaves( new BaseMatch.KeyWord("=").add_leaves( new BaseMatch.Float().add_leaves(
        new BaseMatch.KeyWord(",").add_leaves(...Selector_Var2),
        new BaseMatch.KeyWord("]").add_leaves(...end_node)
    )))
    Selector_Var2[4].add_leaves( new BaseMatch.KeyWord("=").add_leaves( new BaseMatch.Float().add_leaves(
        new BaseMatch.KeyWord(",").add_leaves(...Selector_Var2),
        new BaseMatch.KeyWord("]").add_leaves(...end_node)
    )))
    Selector_Var2[5].add_leaves( new BaseMatch.KeyWord("=").add_leaves( new BaseMatch.Int().add_leaves(
        new BaseMatch.KeyWord(",").add_leaves(...Selector_Var2),
        new BaseMatch.KeyWord("]").add_leaves(...end_node)
    )))
    Selector_Var2[6].add_leaves( new BaseMatch.KeyWord("=").add_leaves( new BaseMatch.Int().add_leaves(
        new BaseMatch.KeyWord(",").add_leaves(...Selector_Var2),
        new BaseMatch.KeyWord("]").add_leaves(...end_node)
    )))
    Selector_Var2[7].add_leaves( new BaseMatch.KeyWord("=").add_leaves( 
        new BaseMatch.AnyString().add_leaves(
            new BaseMatch.KeyWord(",").add_leaves(...Selector_Var2),
            new BaseMatch.KeyWord("]").add_leaves(...end_node)
        ),
        new BaseMatch.KeyWord("!").add_leaves( new BaseMatch.AnyString().add_leaves(
            new BaseMatch.KeyWord(",").add_leaves(...Selector_Var2),
            new BaseMatch.KeyWord("]").add_leaves(...end_node)
        )),
    ))
    Selector_Var2[8].add_leaves( new BaseMatch.KeyWord("=").add_leaves(
        new BaseMatch.Enum("0","survival","s","1","creative","c","2","adventure","a","spectator").add_leaves(
            new BaseMatch.KeyWord(",").add_leaves(...Selector_Var2),
            new BaseMatch.KeyWord("]").add_leaves(...end_node)
        ),
        new BaseMatch.KeyWord("!").add_leaves( 
            new BaseMatch.Enum("0","survival","s","1","creative","c","2","adventure","a","spectator").add_leaves(
                new BaseMatch.KeyWord(",").add_leaves(...Selector_Var2),
                new BaseMatch.KeyWord("]").add_leaves(...end_node)
            )
        )
    ))
    Selector_Var2[9].add_leaves( new BaseMatch.KeyWord("=").add_leaves( 
        new BaseMatch.KeyWord("!").add_leaves( 
            new BE_String().add_leaves(
                new BaseMatch.KeyWord(",").add_leaves(...Selector_Var2),
                new BaseMatch.KeyWord("]").add_leaves(...end_node)
            ),
            new BE_Quotation_String().add_leaves(
                new BaseMatch.KeyWord(",").add_leaves(...Selector_Var2),
                new BaseMatch.KeyWord("]").add_leaves(...end_node)
            )
        ),
        new BE_String().add_leaves(
            new BaseMatch.KeyWord(",").add_leaves(...Selector_Var2),
            new BaseMatch.KeyWord("]").add_leaves(...end_node)
        ),
        new BE_Quotation_String().add_leaves(
            new BaseMatch.KeyWord(",").add_leaves(...Selector_Var2),
            new BaseMatch.KeyWord("]").add_leaves(...end_node)
        )
    ))
    Selector_Var2[10].add_leaves( new BaseMatch.KeyWord("=").add_leaves( middle_scores_loop(
        new BaseMatch.KeyWord(",").add_leaves(...Selector_Var2),
        new BaseMatch.KeyWord("]").add_leaves(...end_node)
    )))
    Selector_Var2[11].add_leaves( new BaseMatch.KeyWord("=").add_leaves( middle_haspermission_loop(
        new BaseMatch.KeyWord(",").add_leaves(...Selector_Var2),
        new BaseMatch.KeyWord("]").add_leaves(...end_node)
    )))
    Selector_Var2[12].add_leaves( new BaseMatch.KeyWord("=").add_leaves( 
        middle_hasitem_multiple_args_loop(
            new BaseMatch.KeyWord(",").add_leaves(...Selector_Var2),
            new BaseMatch.KeyWord("]").add_leaves(...end_node)
        ),
        middle_hasitem_single_args_loop(
            new BaseMatch.KeyWord(",").add_leaves(...Selector_Var2),
            new BaseMatch.KeyWord("]").add_leaves(...end_node)
        )
    ))


    const Selector = [
        new BaseMatch.KeyWord("@p","@a","@r","@s","@e","@initiator").add_leaves(
            new BaseMatch.KeyWord("[").add_leaves(...Selector_Var2),
            ...end_node
        ),
        new BE_String().add_leaves(...end_node),
        new BE_Quotation_String().add_leaves(...end_node)
    ]
    return Selector
}










