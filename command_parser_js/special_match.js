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
    constructor(){
        super("Root")
    }
    
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
    token_type : 定义该匹配的参数含义
    terminator : 匹配停止的所有字符\n
    >>> BE_Range_Int()
    */
    constructor(token_type){
        super(token_type)
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
    token_type : 定义该匹配的参数含义
    terminator : 匹配停止的所有字符\n
    >>> BE_String()
    */
    constructor(token_type){
        super(token_type)
        this.re_match = re.compile(`[^${BaseMatch.TERMINATOR_RE}]{0,}`)
        this.re_test  = re.compile("^[-+]?([0-9]{0,}\\.[0-9]{1,}|[0-9]{1,}\\.[0-9]{0,}|[0-9]{1,})$") 
    }
    _match_string(s, s_pointer){
        const _match = this.re_match.match(s,s_pointer)
        if ( ( _match.group().length === 0 ) || ( this.re_test.search(_match.group()) != null ) ) { 
            throw new Illegal_Match(`>>${_match.group()}<< 并不是有效字符串`, 
            Array(_match.start(),_match.end()), _match.group())
        }
        return {"type":this.token_type, "token":_match}
    }
    _auto_complete(){ return {"string":""} }
}
export class BE_Quotation_String extends BaseMatch.Match_Base {
    /*
    MCBE版引号字符串匹配
    ------------------------------
    在下一次匹配中，只能匹配到双引号开头的合法字符串\n
    ------------------------------
    实例化参数\n
    token_type : 定义该匹配的参数含义\n
    >>> BE_Quotation_String()
    */
    constructor(token_type){
        super(token_type)
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
        return {"type":this.token_type, "token":_match}
    }
    _auto_complete() { return {'"string"':""} }
}
export class Relative_Offset_Float extends BaseMatch.Match_Base {
    /*
    绝对/相对坐标
    ------------------------------
    在下一次匹配中，需要匹配到合法的一个绝对/相对坐标\n
    ------------------------------
    实例化参数\n
    token_type : 定义该匹配的参数含义\n
    >>> Relative_Offset_Float()
    */
    constructor(token_type){
        super(token_type)
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
        return {"type":this.token_type, "token":_match}
    }
    _auto_complete() { 
        if (this.argument_dimension.length) return {"~":this.argument_dimension[0]}
        return {"~":""} 
    }
}
export class Local_Offset_Float extends BaseMatch.Match_Base {
    /*
    局部坐标
    ------------------------------
    在下一次匹配中，需要匹配到合法一个的局部坐标\n
    ------------------------------
    实例化参数\n
    token_type : 定义该匹配的参数含义\n
    >>> Local_Offset_Float()
    */
    constructor(token_type){
        super(token_type)
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
        return {"type":this.token_type, "token":_match}
    }
    _auto_complete() { 
        if (this.argument_dimension.length) return {"~":this.argument_dimension[0]}
        return {"^":""}
    }
}


export function Pos_Tree(...end_node) {
    /*
    自动生成一个坐标匹配树\n
    ...end_node : 添加下一级匹配类\n
    -------------------------------
    返回匹配列表，请将该列表传入add_leaves时添加解包操作
    */
    return [
        new BaseMatch.Float("Absolute_Pos:绝对x坐标").add_leaves(
            new Relative_Offset_Float("Relative_Pos:相对y坐标").add_leaves(
                new Relative_Offset_Float("Relative_Pos:相对z坐标").add_leaves(...end_node),
                new BaseMatch.Float("Absolute_Pos:绝对z坐标").add_leaves(...end_node),
            ),
            new BaseMatch.Float("Absolute_Pos:绝对y坐标").add_leaves(
                new Relative_Offset_Float("Relative_Pos:相对z坐标").add_leaves(...end_node),
                new BaseMatch.Float("Absolute_Pos:绝对z坐标").add_leaves(...end_node),
            )
        ),
        new Relative_Offset_Float("Relative_Pos:相对x坐标").add_leaves(
            new Relative_Offset_Float("Relative_Pos:相对y坐标").add_leaves(
                new Relative_Offset_Float("Relative_Pos:相对z坐标").add_leaves(...end_node),
                new BaseMatch.Float("Absolute_Pos:绝对z坐标").add_leaves(...end_node),
            ),
            new BaseMatch.Float("Absolute_Pos:绝对y坐标").add_leaves(
                new Relative_Offset_Float("Relative_Pos:相对z坐标").add_leaves(...end_node),
                new BaseMatch.Float("Absolute_Pos:绝对z坐标").add_leaves(...end_node),
            )
        ),
        new Local_Offset_Float("Local_Pos:局部左坐标").add_leaves(
            new Local_Offset_Float("Local_Pos:局部上坐标").add_leaves(
                new Local_Offset_Float("Local_Pos:局部前坐标").add_leaves(...end_node)
            )
        )
    ]
}
export function Range_Tree(...end_node) {
    /*
    自动生成一个范围值匹配树\n
    ...end_node : 添加下一级匹配类\n
    -------------------------------
    返回匹配列表，请将该列表传入add_leaves时添加解包操作
    */
    return [
        new BE_Range_Int("Range_Min:范围下限值").add_leaves( 
            new BaseMatch.KeyWord("Range_Sign","..").add_leaves( 
                new BE_Range_Int("Range_Max:范围上限值").add_leaves(...end_node),
                ...end_node
            ),
            ...end_node
        ),
        new BaseMatch.KeyWord("Range_Sign","..").add_leaves( 
            new BE_Range_Int("Range_Max:范围上限值").add_leaves(...end_node)
        ),
        new BaseMatch.KeyWord("Not:将条件取反","!").add_leaves(
            new BE_Range_Int("Range_Min:范围下限值").add_leaves( 
                new BaseMatch.KeyWord("Range_Sign","..").add_leaves( 
                    new BE_Range_Int("Range_Max:范围上限值").add_leaves(...end_node),
                    ...end_node
                ),
                ...end_node
            ),
            new BaseMatch.KeyWord("Range_Sign","..").add_leaves( 
                new BE_Range_Int("Range_Max:范围上限值").add_leaves(...end_node)
            )
        )
    ]
}
export function BE_Selector_Tree(...end_node) {
    /*
    自动生成一个目标选择器选择器匹配树\n
    ...end_node : 添加下一级匹配类\n
    -------------------------------
    返回匹配列表，请将该列表传入add_leaves时添加解包操作
    */

    function middle_scores_loop(...end_node) {
        const scores = [
            new BE_String("Scoreboard_Name"),
            new BE_Quotation_String("Scoreboard_Name")
        ]
        scores[0].add_leaves( new BaseMatch.KeyWord("Equal","=").add_leaves( ...Range_Tree(
            new BaseMatch.KeyWord("Next_Score_Argument:下一个分数条件",",").add_leaves(...scores),
            new BaseMatch.KeyWord("End_Score_Argument:条件结束","}").add_leaves(...end_node)
        )))
        scores[1].add_leaves( new BaseMatch.KeyWord("Equal","=").add_leaves( ...Range_Tree(
            new BaseMatch.KeyWord("Next_Score_Argument:下一个分数条件",",").add_leaves(...scores),
            new BaseMatch.KeyWord("End_Score_Argument:条件结束","}").add_leaves(...end_node)
        )))
        return new BaseMatch.KeyWord("Start_Score_Argument:条件开始","{").add_leaves(...scores)
    }
    function middle_haspermission_loop(...end_node) {
        const haspermission1 = new BaseMatch.KeyWord("Start_Permission_Argument:条件开始","{")
        const haspermission2 = new BaseMatch.Enum("Permission_Argument:头部转动权限;人物移动权限","camera","movement")
        haspermission2.add_leaves( 
            new BaseMatch.KeyWord("Equal","=").add_leaves( 
                new BaseMatch.Enum("Value:启用;禁用","enabled","disabled").add_leaves( 
                    new BaseMatch.KeyWord("Next_Permission_Argument:下一个权限条件",",").add_leaves(haspermission2),
                    new BaseMatch.KeyWord("End_Permission_Argument:条件结束","}").add_leaves(...end_node)
                )
            )
        )
        return haspermission1.add_leaves(haspermission2)
    }
    function middle_hasitem_single_args_loop(...end_node) {
        const hasitem = [
            new BaseMatch.Char("Item_Argument:物品","item"),
            new BaseMatch.Char("Item_Argument:物品数据值","data"),
            new BaseMatch.Char("Item_Argument:物品数量","quantity"),
            new BaseMatch.Char("Item_Argument:槽位","location"),
            new BaseMatch.Char("Item_Argument:槽位编号","slot")
        ]
        hasitem[0].add_leaves( new BaseMatch.KeyWord("Equal","=").add_leaves( 
            new BaseMatch.AnyString("Item_ID").add_leaves( 
                new BaseMatch.KeyWord("Next_Item_Argument:下一个参数条件",",").add_leaves(...hasitem),
                new BaseMatch.KeyWord("End_Item_Argument:条件结束","}").add_leaves(...end_node)
            )
        ))
        hasitem[1].add_leaves( new BaseMatch.KeyWord("Equal","=").add_leaves( 
            new BaseMatch.Int("Data_Value").add_leaves( 
                new BaseMatch.KeyWord("Next_Item_Argument:下一个参数条件",",").add_leaves(...hasitem),
                new BaseMatch.KeyWord("End_Item_Argument:条件结束","}").add_leaves(...end_node)
            )
        ))
        hasitem[2].add_leaves( new BaseMatch.KeyWord("Equal","=").add_leaves( 
            ...Range_Tree( 
                new BaseMatch.KeyWord("Next_Item_Argument:下一个参数条件",",").add_leaves(...hasitem),
                new BaseMatch.KeyWord("End_Item_Argument:条件结束","}").add_leaves(...end_node)
            )
        ))
        hasitem[3].add_leaves( new BaseMatch.KeyWord("Equal","=").add_leaves( 
            new BaseMatch.AnyString("Slot_ID").add_leaves( 
                new BaseMatch.KeyWord("Next_Item_Argument:下一个参数条件",",").add_leaves(...hasitem),
                new BaseMatch.KeyWord("End_Item_Argument:条件结束","}").add_leaves(...end_node)
            )
            /*
            "slot.weapon.mainhand","slot.weapon.offhand",
            "slot.armor.head","slot.armor.chest","slot.armor.legs","slot.armor.feet",
            "slot.enderchest","slot.hotbar","slot.inventory","slot.saddle","slot.armor",
            "slot.armor","slot.chest","slot.equippable"
            */
        ))
        hasitem[4].add_leaves( new BaseMatch.KeyWord("Equal","=").add_leaves( 
            ...Range_Tree( 
                new BaseMatch.KeyWord("Next_Item_Argument:下一个参数条件",",").add_leaves(...hasitem),
                new BaseMatch.KeyWord("End_Item_Argument:条件结束","}").add_leaves(...end_node)
            )
        ))
        return new BaseMatch.KeyWord("Start_Item_Argument:条件开始","{").add_leaves(...hasitem)
    }
    function middle_hasitem_multiple_args_loop(...end_node) {
        const hasitem1 = new BaseMatch.KeyWord("Start_Item_Condition:条件开始","[")
        const m1 = new BaseMatch.KeyWord("Next_Item_Condition:下一个物品条件",",")
        const hasitem2 = middle_hasitem_single_args_loop( 
            m1, new BaseMatch.KeyWord("End_Item_Condition:条件结束","]").add_leaves(...end_node)
        )
        m1.add_leaves(hasitem2)
        return hasitem1.add_leaves(hasitem2)
    }

    const Selector_Var2 = [
        new BaseMatch.Enum("Selector_Argument:x坐标值;y坐标值;z坐标值","x","y","z"),    // 0
        new BaseMatch.Enum("Selector_Argument:体积x长度;体积y长度;体积z长度;距离上限;距离下限;垂直视角上限;垂直视角下限;水平视角上限;水平视角下限","dx","dy","dz","r","rm","rx","rxm","ry","rym"), // 1
        new BaseMatch.Enum("Selector_Argument:等级上限;等级下限;选择数量上限","l","lm","c"),       // 2
        new BaseMatch.Char("Selector_Argument:实体类型","type"),         // 3
        new BaseMatch.Char("Selector_Argument:游戏模式","m"),            // 4
        new BaseMatch.Enum("Selector_Argument:实体标签;实体名字;实体族群","tag","name","family"), // 5
        new BaseMatch.Char("Selector_Argument:分数条件","scores"),       // 6
        new BaseMatch.Char("Selector_Argument:权限条件","haspermission"),// 7
        new BaseMatch.Char("Selector_Argument:物品条件","hasitem")       // 8
    ]


    Selector_Var2[0].add_leaves( new BaseMatch.KeyWord("Equal","=").add_leaves( 
        new Relative_Offset_Float("Relative_Value:相对值").add_leaves(
            new BaseMatch.KeyWord("Next_Selector_Argument:下一个选择器条件",",").add_leaves(...Selector_Var2),
            new BaseMatch.KeyWord("End_Selector_Argument:选择器条件结束","]").add_leaves(...end_node)
        ),
        new BaseMatch.Float("Value:绝对值").add_leaves(
            new BaseMatch.KeyWord("Next_Selector_Argument:下一个选择器条件",",").add_leaves(...Selector_Var2),
            new BaseMatch.KeyWord("End_Selector_Argument:选择器条件结束","]").add_leaves(...end_node)
        )
    ))
    Selector_Var2[1].add_leaves( new BaseMatch.KeyWord("Equal","=").add_leaves( new BaseMatch.Float("Value").add_leaves(
        new BaseMatch.KeyWord("Next_Selector_Argument:下一个选择器条件",",").add_leaves(...Selector_Var2),
        new BaseMatch.KeyWord("End_Selector_Argument:选择器条件结束","]").add_leaves(...end_node)
    )))
    Selector_Var2[2].add_leaves( new BaseMatch.KeyWord("Equal","=").add_leaves( new BaseMatch.Int("Value").add_leaves(
        new BaseMatch.KeyWord("Next_Selector_Argument:下一个选择器条件",",").add_leaves(...Selector_Var2),
        new BaseMatch.KeyWord("End_Selector_Argument:选择器条件结束","]").add_leaves(...end_node)
    )))
    Selector_Var2[3].add_leaves( new BaseMatch.KeyWord("Equal","=").add_leaves( 
        new BaseMatch.AnyString("Value").add_leaves(
            new BaseMatch.KeyWord("Next_Selector_Argument:下一个选择器条件",",").add_leaves(...Selector_Var2),
            new BaseMatch.KeyWord("End_Selector_Argument:选择器条件结束","]").add_leaves(...end_node)
        ),
        new BaseMatch.KeyWord("Not:将条件取反","!").add_leaves( new BaseMatch.AnyString("Value").add_leaves(
            new BaseMatch.KeyWord("Next_Selector_Argument:下一个选择器条件",",").add_leaves(...Selector_Var2),
            new BaseMatch.KeyWord("End_Selector_Argument:选择器条件结束","]").add_leaves(...end_node)
        )),
    ))
    Selector_Var2[4].add_leaves( new BaseMatch.KeyWord("Equal","=").add_leaves(
        new BaseMatch.Enum("Value:生存模式;生存模式;生存模式;创造模式;创造模式;创造模式;冒险模式;冒险模式;冒险模式;观察者模式",
        "0","survival","s","1","creative","c","2","adventure","a","spectator").add_leaves(
            new BaseMatch.KeyWord("Next_Selector_Argument:下一个选择器条件",",").add_leaves(...Selector_Var2),
            new BaseMatch.KeyWord("End_Selector_Argument:选择器条件结束","]").add_leaves(...end_node)
        ),
        new BaseMatch.KeyWord("Not:将条件取反","!").add_leaves( 
            new BaseMatch.Enum("Value:生存模式;生存模式;生存模式;创造模式;创造模式;创造模式;冒险模式;冒险模式;冒险模式;观察者模式",
            "0","survival","s","1","creative","c","2","adventure","a","spectator").add_leaves(
                new BaseMatch.KeyWord("Next_Selector_Argument:下一个选择器条件",",").add_leaves(...Selector_Var2),
                new BaseMatch.KeyWord("End_Selector_Argument:选择器条件结束","]").add_leaves(...end_node)
        )
    )))
    Selector_Var2[5].add_leaves( new BaseMatch.KeyWord("Equal","=").add_leaves( 
        new BaseMatch.KeyWord("Not:将条件取反","!").add_leaves( 
            new BE_String("Value").add_leaves(
                new BaseMatch.KeyWord("Next_Selector_Argument:下一个选择器条件",",").add_leaves(...Selector_Var2),
                new BaseMatch.KeyWord("End_Selector_Argument:选择器条件结束","]").add_leaves(...end_node)
            ),
            new BE_Quotation_String("Value").add_leaves(
                new BaseMatch.KeyWord("Next_Selector_Argument:下一个选择器条件",",").add_leaves(...Selector_Var2),
                new BaseMatch.KeyWord("End_Selector_Argument:选择器条件结束","]").add_leaves(...end_node)
            )
        ),
        new BE_String("Value").add_leaves(
            new BaseMatch.KeyWord("Next_Selector_Argument:下一个选择器条件",",").add_leaves(...Selector_Var2),
            new BaseMatch.KeyWord("End_Selector_Argument:选择器条件结束","]").add_leaves(...end_node)
        ),
        new BE_Quotation_String("Value").add_leaves(
            new BaseMatch.KeyWord("Next_Selector_Argument:下一个选择器条件",",").add_leaves(...Selector_Var2),
            new BaseMatch.KeyWord("End_Selector_Argument:选择器条件结束","]").add_leaves(...end_node)
        )
    ))
    Selector_Var2[6].add_leaves( new BaseMatch.KeyWord("Equal","=").add_leaves( middle_scores_loop(
        new BaseMatch.KeyWord("Next_Selector_Argument:下一个选择器条件",",").add_leaves(...Selector_Var2),
        new BaseMatch.KeyWord("End_Selector_Argument:选择器条件结束","]").add_leaves(...end_node)
    )))
    Selector_Var2[7].add_leaves( new BaseMatch.KeyWord("Equal","=").add_leaves( middle_haspermission_loop(
        new BaseMatch.KeyWord("Next_Selector_Argument:下一个选择器条件",",").add_leaves(...Selector_Var2),
        new BaseMatch.KeyWord("End_Selector_Argument:选择器条件结束","]").add_leaves(...end_node)
    )))
    Selector_Var2[8].add_leaves( new BaseMatch.KeyWord("Equal","=").add_leaves( 
        middle_hasitem_multiple_args_loop(
            new BaseMatch.KeyWord("Next_Selector_Argument:下一个选择器条件",",").add_leaves(...Selector_Var2),
            new BaseMatch.KeyWord("End_Selector_Argument:选择器条件结束","]").add_leaves(...end_node)
        ),
        middle_hasitem_single_args_loop(
            new BaseMatch.KeyWord("Next_Selector_Argument:下一个选择器条件",",").add_leaves(...Selector_Var2),
            new BaseMatch.KeyWord("End_Selector_Argument:选择器条件结束","]").add_leaves(...end_node)
        )
    ))


    const Selector = [
        new BaseMatch.KeyWord("Selector:最近的玩家;所有在线玩家;随机玩家或实体;命令的执行者;所有存活的实体","@p","@a","@r","@s","@e","@initiator").add_leaves(
            new BaseMatch.KeyWord("Start_Selector_Argument:选择器条件开始","[").add_leaves(...Selector_Var2),
            ...end_node
        ),
        new BE_String("Player_Name").add_leaves(...end_node),
        new BE_Quotation_String("Player_Name").add_leaves(...end_node)
    ]
    return Selector
}










