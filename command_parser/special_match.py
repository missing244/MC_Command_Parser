"""
针对 Minecraft 中特殊的结构内建的匹配类
"""

from . import base_match_class as BaseMatch
from typing import Dict,Union,List,Tuple
import re

__all__ = ["BE_String","BE_Quotation_String","Relative_Offset_Float","Local_Offset_Float"]

class Illegal_Match(BaseMatch.Command_Match_Exception) : pass


class Command_Root(BaseMatch.Match_Base) :
    '''
    命令根类
    ------------------
    命令应该由此类开始add_leaves\n
    '''
    def __repr__(self) -> str:
        return str(self.tree_leaves)
    
    def __init__(self) -> None:
        super().__init__("Root")
    
    def add_leaves(self,*obj) :
        for i in obj :
            if not isinstance(i,BaseMatch.Match_Base) : 
                raise BaseMatch.Not_Match_Object("obj 不应该存在非 Match_Base 对象")
        super().add_leaves(*obj)
        return self
    def _match_string(self,s:str,s_pointer:int) : pass
    def _auto_complete(self) -> Dict[str,str] : pass


class BE_Range_Int(BaseMatch.Int) :
    """
    MCBE版范围整数匹配
    ------------------------------
    在下一次匹配中，只能匹配到范围整数\n
    ------------------------------
    实例化参数\n
    token_type : 定义该匹配的参数含义\n
    terminator : 匹配停止的所有字符\n
    >>> BE_Range_Int("Range_Max")
    """
    
    def __init__(self, token_type:str, terminator:str=BaseMatch.TERMINATOR_RE) -> None :
        if not isinstance(terminator,str) : raise TypeError("terminator 提供字符串以外的参数")
        super().__init__(token_type)
        self.re_match = re.compile("[^%s\\.]{0,}" % terminator)

class BE_String(BaseMatch.Match_Base) :
    """
    MCBE版普通字符串匹配
    ------------------------------
    在下一次匹配中，只能匹配到非双引号开头的，非数字字符串\n
    ------------------------------
    实例化参数\n
    token_type : 定义该匹配的参数含义\n
    terminator : 匹配停止的所有字符\n
    >>> BE_String("Player")
    """
    
    def __init__(self, token_type:str, terminator:str=BaseMatch.TERMINATOR_RE) -> None :
        if not isinstance(terminator,str) : raise TypeError("terminator 提供字符串以外的参数")
        super().__init__(token_type)
        self.re_match = re.compile("[^%s]{0,}" % terminator)
        self.re_test  = re.compile("^[-+]?([0-9]{0,}\\.[0-9]{1,}|[0-9]{1,}\\.[0-9]{0,}|[0-9]{1,})$") 

    def _match_string(self,s:str,s_pointer:int) :
        _match = self.re_match.match(s,pos=s_pointer)
        if (not _match.group()) or (self.re_test.search(_match.group())) : 
            raise Illegal_Match(">>%s<< 并不是有效字符串" % _match.group(), pos=(_match.start(),_match.end()), word=_match.group())
        return {"type":self.token_type, "token":_match}

    def _auto_complete(self) -> Dict[str,str]: 
        return {"string":""}

class BE_Quotation_String(BaseMatch.Match_Base) :
    """
    MCBE版引号字符串匹配
    ------------------------------
    在下一次匹配中，只能匹配到双引号开头的合法字符串\n
    ------------------------------
    实例化参数\n
    token_type : 定义该匹配的参数含义\n
    >>> BE_Quotation_String("Player")
    """

    def __init__(self, token_type: str) -> None :
        super().__init__(token_type)
        self.re_match = re.compile('"(\\\\.|[^\\\\"]){0,}"')

    def _match_string(self,s:str,s_pointer:int) : 
        len_s = len(s)

        if s[s_pointer] != "\"" :
            raise Illegal_Match(">>%s<< 并不是有效的引号字符串" % s[s_pointer], pos=(s_pointer,s_pointer+1), word=s[s_pointer])

        _match = self.re_match.match(s,s_pointer)
        if not _match : raise Illegal_Match(">>%s<< 并不是有效的引号字符串" % s[s_pointer:len_s], pos=(s_pointer,len_s), word=s[s_pointer:len_s])

        return {"type":self.token_type, "token":_match}

    def _auto_complete(self) -> Dict[str,str] : 
        return {'"string"':""}

class Relative_Offset_Float(BaseMatch.Match_Base) :
    """
    相对坐标
    ------------------------------
    在下一次匹配中，需要匹配到合法的一个绝对/相对坐标\n
    ------------------------------
    实例化参数\n
    token_type : 定义该匹配的参数含义\n
    >>> Relative_Offset_Float("Pos")
    """
    
    def __init__(self, token_type:str) -> None :
        super().__init__(token_type)
        self.re_match = re.compile("~[-\\+]?[0-9\\.]{0,}")
        self.re_test  = re.compile("^[-+]?([0-9]{0,}\\.[0-9]{1,}|[0-9]{1,}\\.[0-9]{0,}|[0-9]{1,})$")

    def _match_string(self,s:str,s_pointer:int): 
        _match = self.re_match.match(s,pos=s_pointer)
        if not _match : raise Illegal_Match(">>%s<< 不合法的相对偏量" % s[s_pointer], pos=(s_pointer,s_pointer + 1), word=s[s_pointer])
        if _match.group().__len__() > 1 : 
            if not self.re_test.search(_match.group()[1:]) :
                raise Illegal_Match(">>%s<< 并不是有效的浮点数" % _match.group()[1:], pos=(_match.start()+1,_match.end()), word=_match.group()[1:])
        return {"type":self.token_type, "token":_match}

    def _auto_complete(self) -> Dict[str,str] : 
        if len(self.argument_dimension) : return {"~":self.argument_dimension[0]}
        return {"~":""}

class Local_Offset_Float(BaseMatch.Match_Base) :
    """
    局部坐标
    ------------------------------
    在下一次匹配中，需要匹配到合法一个的局部坐标\n
    ------------------------------
    实例化参数\n
    token_type : 定义该匹配的参数含义\n
    >>> Local_Offset_Float("Pos")
    """
    
    def __init__(self,token_type:str) -> None :
        super().__init__(token_type)
        self.re_match = re.compile("(\\^)[-\\+]?[0-9\\.]{0,}")
        self.re_test  = re.compile("^[-+]?([0-9]{0,}\\.[0-9]{1,}|[0-9]{1,}\\.[0-9]{0,}|[0-9]{1,})$")

    def _match_string(self,s:str,s_pointer:int): 
        _match = self.re_match.match(s,pos=s_pointer)
        if not _match : raise Illegal_Match(">>%s<< 不合法的相对偏量" % s[s_pointer], pos=(s_pointer,s_pointer + 1), word=s[s_pointer])
        if _match.group().__len__() > 1 : 
            if not self.re_test.search(_match.group()[1:]) :
                raise Illegal_Match(">>%s<< 并不是有效的浮点数" % _match.group()[1:], pos=(_match.start()+1,_match.end()), word=_match.group()[1:])
        return {"type":self.token_type, "token":_match}

    def _auto_complete(self) -> Dict[str,str] : 
        if len(self.argument_dimension) : return {"^":self.argument_dimension[0]}
        return {"^":""}


def Pos_Tree(*end_node:BaseMatch.Match_Base) -> List[BaseMatch.Match_Base] :
    """
    自动生成一个坐标匹配树\n
    *end_node : 添加下一级匹配类\n
    -------------------------------
    返回匹配列表，请将该列表传入add_leaves时添加解包操作
    """
    return [
        BaseMatch.Float("Absolute_Pos:绝对x坐标").add_leaves(
            Relative_Offset_Float("Relative_Pos:相对y坐标").add_leaves(
                Relative_Offset_Float("Relative_Pos:相对z坐标").add_leaves(*end_node),
                BaseMatch.Float("Absolute_Pos:绝对z坐标").add_leaves(*end_node),
            ),
            BaseMatch.Float("Absolute_Pos:绝对y坐标").add_leaves(
                Relative_Offset_Float("Relative_Pos:相对z坐标").add_leaves(*end_node),
                BaseMatch.Float("Absolute_Pos:绝对z坐标").add_leaves(*end_node),
            )
        ),
        Relative_Offset_Float("Relative_Pos:相对x坐标").add_leaves(
            Relative_Offset_Float("Relative_Pos:相对y坐标").add_leaves(
                Relative_Offset_Float("Relative_Pos:相对z坐标").add_leaves(*end_node),
                BaseMatch.Float("Absolute_Pos:绝对z坐标").add_leaves(*end_node),
            ),
            BaseMatch.Float("Absolute_Pos:绝对y坐标").add_leaves(
                Relative_Offset_Float("Relative_Pos:相对z坐标").add_leaves(*end_node),
                BaseMatch.Float("Absolute_Pos:绝对z坐标").add_leaves(*end_node),
            )
        ),
        Local_Offset_Float("Local_Pos:局部左坐标").add_leaves(
            Local_Offset_Float("Local_Pos:局部上坐标").add_leaves(
                Local_Offset_Float("Local_Pos:局部前坐标").add_leaves(*end_node)
            )
        )
    ]

def Range_Tree(*end_node:BaseMatch.Match_Base) -> List[BaseMatch.Match_Base] :
    """
    自动生成一个范围值匹配树\n
    *end_node : 添加下一级匹配类\n
    -------------------------------
    返回匹配列表，请将该列表传入add_leaves时添加解包操作
    """
    return [
        BE_Range_Int("Range_Min:范围下限值").add_leaves( 
            BaseMatch.KeyWord("Range_Sign","..").add_leaves( 
                BE_Range_Int("Range_Max:范围上限值").add_leaves(*end_node),
                *end_node
            ),
            *end_node
        ),
        BaseMatch.KeyWord("Range_Sign","..").add_leaves( 
            BE_Range_Int("Range_Max:范围上限值").add_leaves(*end_node)
        ),
        BaseMatch.KeyWord("Not:将条件取反","!").add_leaves(
            BE_Range_Int("Range_Min:范围下限值").add_leaves( 
                BaseMatch.KeyWord("Range_Sign","..").add_leaves( 
                    BE_Range_Int("Range_Max:范围上限值").add_leaves(*end_node),
                    *end_node
                ),
                *end_node
            ),
            BaseMatch.KeyWord("Range_Sign","..").add_leaves( 
                BE_Range_Int("Range_Max:范围上限值").add_leaves(*end_node)
            )
        )
    ]

def BE_Selector_Tree(*end_node:BaseMatch.Match_Base) :
    """
    自动生成一个目标选择器选择器匹配树\n
    *end_node : 添加下一级匹配类\n
    -------------------------------
    返回匹配列表，请将该列表传入add_leaves时添加解包操作
    """

    def middle_scores_loop(*end_node:BaseMatch.Match_Base) :
        scores : List[BaseMatch.Match_Base] = [
            BE_String("Scoreboard_Name"),
            BE_Quotation_String("Scoreboard_Name")
        ]
        scores[0].add_leaves( BaseMatch.KeyWord("Equal","=").add_leaves( *Range_Tree(
            BaseMatch.KeyWord("Next_Score_Argument:下一个分数条件",",").add_leaves(*scores),
            BaseMatch.KeyWord("End_Score_Argument:条件结束","}").add_leaves(*end_node)
        )))
        scores[1].add_leaves( BaseMatch.KeyWord("Equal","=").add_leaves( *Range_Tree(
            BaseMatch.KeyWord("Next_Score_Argument:下一个分数条件",",").add_leaves(*scores),
            BaseMatch.KeyWord("End_Score_Argument:条件结束","}").add_leaves(*end_node)
        )))
        return BaseMatch.KeyWord("Start_Score_Argument:条件开始","{").add_leaves(*scores)

    def middle_haspermission_loop(*end_node:BaseMatch.Match_Base) :
        haspermission1 = BaseMatch.KeyWord("Start_Permission_Argument:条件开始","{")
        haspermission2 = BaseMatch.Enum("Permission_Argument:头部转动权限;人物移动权限","camera","movement")
        haspermission2.add_leaves( 
            BaseMatch.KeyWord("Equal","=").add_leaves( 
                BaseMatch.Enum("Value:启用;禁用","enabled","disabled").add_leaves( 
                    BaseMatch.KeyWord("Next_Permission_Argument:下一个权限条件",",").add_leaves(haspermission2),
                    BaseMatch.KeyWord("End_Permission_Argument:条件结束","}").add_leaves(*end_node)
                )
            )
        )
        return haspermission1.add_leaves(haspermission2)

    def middle_hasitem_single_args_loop(*end_node:BaseMatch.Match_Base) :
        hasitem : List[BaseMatch.Match_Base] = [
            BaseMatch.Char("Item_Argument:物品","item"),
            BaseMatch.Char("Item_Argument:物品数据值","data"),
            BaseMatch.Char("Item_Argument:物品数量","quantity"),
            BaseMatch.Char("Item_Argument:槽位","location"),
            BaseMatch.Char("Item_Argument:槽位编号","slot")
        ]
        hasitem[0].add_leaves( BaseMatch.KeyWord("Equal","=").add_leaves( 
            BaseMatch.AnyString("Item_ID").add_leaves( 
                BaseMatch.KeyWord("Next_Item_Argument:下一个参数条件",",").add_leaves(*hasitem),
                BaseMatch.KeyWord("End_Item_Argument:条件结束","}").add_leaves(*end_node)
            )
        ))
        hasitem[1].add_leaves( BaseMatch.KeyWord("Equal","=").add_leaves( 
            BaseMatch.Int("Data_Value").add_leaves( 
                BaseMatch.KeyWord("Next_Item_Argument:下一个参数条件",",").add_leaves(*hasitem),
                BaseMatch.KeyWord("End_Item_Argument:条件结束","}").add_leaves(*end_node)
            )
        ))
        hasitem[2].add_leaves( BaseMatch.KeyWord("Equal","=").add_leaves( 
            *Range_Tree( 
                BaseMatch.KeyWord("Next_Item_Argument:下一个参数条件",",").add_leaves(*hasitem),
                BaseMatch.KeyWord("End_Item_Argument:条件结束","}").add_leaves(*end_node)
            )
        ))
        hasitem[3].add_leaves( BaseMatch.KeyWord("Equal","=").add_leaves( 
            BaseMatch.Enum("Slot_ID").add_leaves( 
                BaseMatch.KeyWord("Next_Item_Argument:下一个参数条件",",").add_leaves(*hasitem),
                BaseMatch.KeyWord("End_Item_Argument:条件结束","}").add_leaves(*end_node)
            )
            #"slot.weapon.mainhand","slot.weapon.offhand",
            #"slot.armor.head","slot.armor.chest","slot.armor.legs","slot.armor.feet",
            #"slot.enderchest","slot.hotbar","slot.inventory","slot.saddle","slot.armor",
            #"slot.armor","slot.chest","slot.equippable"
        ))
        hasitem[4].add_leaves( BaseMatch.KeyWord("Equal","=").add_leaves( 
            *Range_Tree( 
                BaseMatch.KeyWord("Next_Item_Argument:下一个参数条件",",").add_leaves(*hasitem),
                BaseMatch.KeyWord("End_Item_Argument:条件结束","}").add_leaves(*end_node)
            )
        ))
        return BaseMatch.KeyWord("Start_Item_Argument:条件开始","{").add_leaves(*hasitem)

    def middle_hasitem_multiple_args_loop(*end_node:BaseMatch.Match_Base) :
        hasitem1 = BaseMatch.KeyWord("Start_Item_Condition:条件开始","[")
        m1 = BaseMatch.KeyWord("Next_Item_Condition:下一个物品条件",",")
        hasitem2 = middle_hasitem_single_args_loop( 
            m1, BaseMatch.KeyWord("End_Item_Condition:条件结束","]").add_leaves(*end_node)
        )
        m1.add_leaves(hasitem2)
        return hasitem1.add_leaves(hasitem2)


    Selector_Var2 : List[BaseMatch.Match_Base] = [
        BaseMatch.Enum("Selector_Argument:x坐标值;y坐标值;z坐标值","x","y","z"),    # 0
        BaseMatch.Enum("Selector_Argument:体积x长度;体积y长度;体积z长度;距离上限;距离下限;垂直视角上限;垂直视角下限;水平视角上限;水平视角下限","dx","dy","dz","r","rm","rx","rxm","ry","rym"), # 1
        BaseMatch.Enum("Selector_Argument:等级上限;等级下限;选择数量上限","l","lm","c"),       # 2
        BaseMatch.Char("Selector_Argument:实体类型","type"),         # 3
        BaseMatch.Char("Selector_Argument:游戏模式","m"),            # 4
        BaseMatch.Enum("Selector_Argument:实体标签;实体名字;实体族群","tag","name","family"), # 5
        BaseMatch.Char("Selector_Argument:分数条件","scores"),       # 6
        BaseMatch.Char("Selector_Argument:权限条件","haspermission"),# 7
        BaseMatch.Char("Selector_Argument:物品条件","hasitem")       # 8
    ]


    Selector_Var2[0].add_leaves( BaseMatch.KeyWord("Equal","=").add_leaves( 
        Relative_Offset_Float("Relative_Value:相对值").add_leaves(
            BaseMatch.KeyWord("Next_Selector_Argument:下一个选择器条件",",").add_leaves(*Selector_Var2),
            BaseMatch.KeyWord("End_Selector_Argument:选择器条件结束","]").add_leaves(*end_node)
        ),
        BaseMatch.Float("Value:绝对值").add_leaves(
            BaseMatch.KeyWord("Next_Selector_Argument:下一个选择器条件",",").add_leaves(*Selector_Var2),
            BaseMatch.KeyWord("End_Selector_Argument:选择器条件结束","]").add_leaves(*end_node)
        )
    ))
    Selector_Var2[1].add_leaves( BaseMatch.KeyWord("Equal","=").add_leaves( BaseMatch.Float("Value").add_leaves(
        BaseMatch.KeyWord("Next_Selector_Argument:下一个选择器条件",",").add_leaves(*Selector_Var2),
        BaseMatch.KeyWord("End_Selector_Argument:选择器条件结束","]").add_leaves(*end_node)
    )))
    Selector_Var2[2].add_leaves( BaseMatch.KeyWord("Equal","=").add_leaves( BaseMatch.Int("Value").add_leaves(
        BaseMatch.KeyWord("Next_Selector_Argument:下一个选择器条件",",").add_leaves(*Selector_Var2),
        BaseMatch.KeyWord("End_Selector_Argument:选择器条件结束","]").add_leaves(*end_node)
    )))
    Selector_Var2[3].add_leaves( BaseMatch.KeyWord("Equal","=").add_leaves( 
        BaseMatch.AnyString("Value").add_leaves(
            BaseMatch.KeyWord("Next_Selector_Argument:下一个选择器条件",",").add_leaves(*Selector_Var2),
            BaseMatch.KeyWord("End_Selector_Argument:选择器条件结束","]").add_leaves(*end_node)
        ),
        BaseMatch.KeyWord("Not:将条件取反","!").add_leaves( BaseMatch.AnyString("Value").add_leaves(
            BaseMatch.KeyWord("Next_Selector_Argument:下一个选择器条件",",").add_leaves(*Selector_Var2),
            BaseMatch.KeyWord("End_Selector_Argument:选择器条件结束","]").add_leaves(*end_node)
        )),
    ))
    Selector_Var2[4].add_leaves( BaseMatch.KeyWord("Equal","=").add_leaves(
            BaseMatch.Enum("Value:生存模式;生存模式;生存模式;创造模式;创造模式;创造模式;冒险模式;冒险模式;冒险模式;观察者模式",
            "0","survival","s","1","creative","c","2","adventure","a","spectator").add_leaves(
                BaseMatch.KeyWord("Next_Selector_Argument:下一个选择器条件",",").add_leaves(*Selector_Var2),
                BaseMatch.KeyWord("End_Selector_Argument:选择器条件结束","]").add_leaves(*end_node)
        ),
        BaseMatch.KeyWord("Not:将条件取反","!").add_leaves( 
            BaseMatch.Enum("Value:生存模式;生存模式;生存模式;创造模式;创造模式;创造模式;冒险模式;冒险模式;冒险模式;观察者模式",
            "0","survival","s","1","creative","c","2","adventure","a","spectator").add_leaves(
                BaseMatch.KeyWord("Next_Selector_Argument:下一个选择器条件",",").add_leaves(*Selector_Var2),
                BaseMatch.KeyWord("End_Selector_Argument:选择器条件结束","]").add_leaves(*end_node)
        )
    )))
    Selector_Var2[5].add_leaves( BaseMatch.KeyWord("Equal","=").add_leaves( 
        BaseMatch.KeyWord("Not:将条件取反","!").add_leaves( 
            BE_String("Value").add_leaves(
                BaseMatch.KeyWord("Next_Selector_Argument:下一个选择器条件",",").add_leaves(*Selector_Var2),
                BaseMatch.KeyWord("End_Selector_Argument:选择器条件结束","]").add_leaves(*end_node)
            ),
            BE_Quotation_String("Value").add_leaves(
                BaseMatch.KeyWord("Next_Selector_Argument:下一个选择器条件",",").add_leaves(*Selector_Var2),
                BaseMatch.KeyWord("End_Selector_Argument:选择器条件结束","]").add_leaves(*end_node)
            )
        ),
        BE_String("Value").add_leaves(
            BaseMatch.KeyWord("Next_Selector_Argument:下一个选择器条件",",").add_leaves(*Selector_Var2),
            BaseMatch.KeyWord("End_Selector_Argument:选择器条件结束","]").add_leaves(*end_node)
        ),
        BE_Quotation_String("Value").add_leaves(
            BaseMatch.KeyWord("Next_Selector_Argument:下一个选择器条件",",").add_leaves(*Selector_Var2),
            BaseMatch.KeyWord("End_Selector_Argument:选择器条件结束","]").add_leaves(*end_node)
        )
    ))
    Selector_Var2[6].add_leaves( BaseMatch.KeyWord("Equal","=").add_leaves( middle_scores_loop(
        BaseMatch.KeyWord("Next_Selector_Argument:下一个选择器条件",",").add_leaves(*Selector_Var2),
        BaseMatch.KeyWord("End_Selector_Argument:选择器条件结束","]").add_leaves(*end_node)
    )))
    Selector_Var2[7].add_leaves( BaseMatch.KeyWord("Equal","=").add_leaves( middle_haspermission_loop(
        BaseMatch.KeyWord("Next_Selector_Argument:下一个选择器条件",",").add_leaves(*Selector_Var2),
        BaseMatch.KeyWord("End_Selector_Argument:选择器条件结束","]").add_leaves(*end_node)
    )))
    Selector_Var2[8].add_leaves( BaseMatch.KeyWord("Equal","=").add_leaves( 
        middle_hasitem_multiple_args_loop(
            BaseMatch.KeyWord("Next_Selector_Argument:下一个选择器条件",",").add_leaves(*Selector_Var2),
            BaseMatch.KeyWord("End_Selector_Argument:选择器条件结束","]").add_leaves(*end_node)
        ),
        middle_hasitem_single_args_loop(
            BaseMatch.KeyWord("Next_Selector_Argument:下一个选择器条件",",").add_leaves(*Selector_Var2),
            BaseMatch.KeyWord("End_Selector_Argument:选择器条件结束","]").add_leaves(*end_node)
        )
    ))


    Selector : List[BaseMatch.Match_Base] = [
        BaseMatch.KeyWord("Selector:最近的玩家;所有在线玩家;随机玩家或实体;命令的执行者;所有存活的实体","@p","@a","@r","@s","@e","@initiator").add_leaves(
            BaseMatch.KeyWord("Start_Selector_Argument:选择器条件开始","[").add_leaves(*Selector_Var2),
            *end_node
        ),
        BE_String("Player_Name").add_leaves(*end_node),
        BE_Quotation_String("Player_Name").add_leaves(*end_node)
    ]
    return Selector






