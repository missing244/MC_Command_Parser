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
    
    def add_leaves(self,*obj) :
        for i in obj :
            if not isinstance(i,BaseMatch.Match_Base) : 
                raise BaseMatch.Not_Match_Object("obj 不应该存在非 Match_Base 对象")
        super().add_leaves(*obj)
        return self
    def _match_string(self,s:str,s_pointer:int) : pass
    def _auto_complete(self) -> List[str] : pass


class BE_Range_Int(BaseMatch.Int) :
    """
    MCBE版范围整数匹配
    ------------------------------
    在下一次匹配中，只能匹配到范围整数\n
    ------------------------------
    实例化参数\n
    terminator : 匹配停止的所有字符\n
    >>> BE_Range_Int()
    """
    
    def __init__(self, terminator:str=BaseMatch.TERMINATOR_RE) -> None :
        if not isinstance(terminator,str) : raise TypeError("terminator 提供字符串以外的参数")
        super().__init__()
        self.re_match = re.compile("[^%s\\.]{0,}" % terminator)

class BE_String(BaseMatch.Match_Base) :
    """
    MCBE版普通字符串匹配
    ------------------------------
    在下一次匹配中，只能匹配到非双引号开头的，非数字字符串\n
    ------------------------------
    实例化参数\n
    terminator : 匹配停止的所有字符\n
    >>> BE_String()
    """
    
    def __init__(self, terminator:str=BaseMatch.TERMINATOR_RE) -> None :
        if not isinstance(terminator,str) : raise TypeError("terminator 提供字符串以外的参数")
        super().__init__()
        self.re_match = re.compile("[^%s]{0,}" % terminator)
        self.re_test  = re.compile("^[-+]?([0-9]{0,}\\.[0-9]{1,}|[0-9]{1,}\\.[0-9]{0,}|[0-9]{1,})$") 

    def _match_string(self,s:str,s_pointer:int) :
        _match = self.re_match.match(s,pos=s_pointer)
        if (not _match.group()) or (self.re_test.search(_match.group())) : 
            raise Illegal_Match(">>%s<< 并不是有效字符串" % _match.group(), pos=(_match.start(),_match.end()), word=_match.group())
        return _match

    def _auto_complete(self) -> List[str]: 
        return ["string"]

class BE_Quotation_String(BaseMatch.Match_Base) :
    """
    MCBE版引号字符串匹配
    ------------------------------
    在下一次匹配中，只能匹配到双引号开头的合法字符串\n
    ------------------------------
    >>> BE_Quotation_String()
    """
    re_match = re.compile('"(\\\\.|[^\\\\"]){0,}"')

    def _match_string(self,s:str,s_pointer:int) : 
        len_s = len(s)

        if s[s_pointer] != "\"" :
            raise Illegal_Match(">>%s<< 并不是有效的引号字符串" % s[s_pointer], pos=(s_pointer,s_pointer+1), word=s[s_pointer])

        _match = self.re_match.match(s,s_pointer)
        if not _match : raise Illegal_Match(">>%s<< 并不是有效的引号字符串" % s[s_pointer:len_s], pos=(s_pointer,len_s), word=s[s_pointer:len_s])

        return _match

    def _auto_complete(self) -> List[str] : 
        return ['"string"']

class Relative_Offset_Float(BaseMatch.Match_Base) :
    """
    绝对/相对坐标
    ------------------------------
    在下一次匹配中，需要匹配到合法的一个绝对/相对坐标\n
    ------------------------------
    >>> Relative_Offset_Float()
    """
    
    def __init__(self) -> None :
        super().__init__()
        self.re_match = re.compile("~[-+]?[0-9\.]{0,}|[-+]?[0-9\.]{0,}")
        self.re_test  = re.compile("^[-+]?([0-9]{0,}\\.[0-9]{1,}|[0-9]{1,}\\.[0-9]{0,}|[0-9]{1,})$")

    def _match_string(self,s:str,s_pointer:int): 
        _match = self.re_match.match(s,pos=s_pointer)
        if not _match : raise Illegal_Match(">>%s<< 不合法的相对偏量" % s[s_pointer], pos=(s_pointer,s_pointer + 1), word=s[s_pointer])
        if _match.group().__len__() > 1 : 
            if not self.re_test.search(_match.group()[1:]) :
                raise Illegal_Match(">>%s<< 并不是有效的浮点数" % _match.group()[1:], pos=(_match.start()+1,_match.end()), word=_match.group()[1:])
        return _match

    def _auto_complete(self) -> List[str] : 
        return ["~"]

class Local_Offset_Float(BaseMatch.Match_Base) :
    """
    局部坐标
    ------------------------------
    在下一次匹配中，需要匹配到合法一个的局部坐标\n
    ------------------------------
    >>> Local_Offset_Float()
    """
    
    def __init__(self) -> None :
        super().__init__()
        self.re_match = re.compile("\\^[-+]?[0-9\.]{0,}")
        self.re_test  = re.compile("^[-+]?([0-9]{0,}\\.[0-9]{1,}|[0-9]{1,}\\.[0-9]{0,}|[0-9]{1,})$")

    def _match_string(self,s:str,s_pointer:int): 
        _match = self.re_match.match(s,pos=s_pointer)
        if not _match : raise Illegal_Match(">>%s<< 不合法的相对偏量" % s[s_pointer], pos=(s_pointer,s_pointer + 1), word=s[s_pointer])
        if _match.group().__len__() > 1 : 
            if not self.re_test.search(_match.group()[1:]) :
                raise Illegal_Match(">>%s<< 并不是有效的浮点数" % _match.group()[1:], pos=(_match.start()+1,_match.end()), word=_match.group()[1:])
        return _match

    def _auto_complete(self) -> List[str] : 
        return ["^"]


def Pos_Tree(*end_node:BaseMatch.Match_Base) -> List[BaseMatch.Match_Base] :
    """
    自动生成一个坐标匹配树\n
    *end_node : 添加下一级匹配类\n
    -------------------------------
    返回匹配列表，请将该列表传入add_leaves时添加解包操作
    """
    return [
        Relative_Offset_Float().add_leaves(*end_node),
        Local_Offset_Float().add_leaves(*end_node)
    ]

def Range_Tree(*end_node:BaseMatch.Match_Base) -> List[BaseMatch.Match_Base] :
    """
    自动生成一个范围值匹配树\n
    *end_node : 添加下一级匹配类\n
    -------------------------------
    返回匹配列表，请将该列表传入add_leaves时添加解包操作
    """
    return [
        BE_Range_Int().add_leaves( 
            BaseMatch.KeyWord("..").add_leaves( 
                BE_Range_Int().add_leaves(*end_node),
                *end_node
            ),
            *end_node
        ),
        BaseMatch.KeyWord("..").add_leaves( 
            BE_Range_Int().add_leaves(*end_node)
        ),
        BaseMatch.KeyWord("!").add_leaves(
            BE_Range_Int().add_leaves( 
                BaseMatch.KeyWord("..").add_leaves( 
                    BE_Range_Int().add_leaves(*end_node),
                    *end_node
                ),
                *end_node
            ),
            BaseMatch.KeyWord("..").add_leaves( 
                BE_Range_Int().add_leaves(*end_node)
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
            BE_String(),
            BE_Quotation_String()
        ]
        scores[0].add_leaves( BaseMatch.KeyWord("=").add_leaves( *Range_Tree(
            BaseMatch.KeyWord(",").add_leaves(*scores),
            BaseMatch.KeyWord("}").add_leaves(*end_node)
        )))
        scores[1].add_leaves( BaseMatch.KeyWord("=").add_leaves( *Range_Tree(
            BaseMatch.KeyWord(",").add_leaves(*scores),
            BaseMatch.KeyWord("}").add_leaves(*end_node)
        )))
        return BaseMatch.KeyWord("{").add_leaves(*scores)

    def middle_haspermission_loop(*end_node:BaseMatch.Match_Base) :
        haspermission1 = BaseMatch.KeyWord("{")
        haspermission2 = BaseMatch.Enum("camera","movement")
        haspermission2.add_leaves( 
            BaseMatch.KeyWord("=").add_leaves( 
                BaseMatch.Enum("enabled","disabled").add_leaves( 
                    BaseMatch.KeyWord(",").add_leaves(haspermission2),
                    BaseMatch.KeyWord("}").add_leaves(*end_node)
                )
            )
        )
        return haspermission1.add_leaves(haspermission2)

    def middle_hasitem_single_args_loop(*end_node:BaseMatch.Match_Base) :
        hasitem : List[BaseMatch.Match_Base] = [
            BaseMatch.Char("item"),
            BaseMatch.Char("data"),
            BaseMatch.Char("quantity"),
            BaseMatch.Char("location"),
            BaseMatch.Char("slot")
        ]
        hasitem[0].add_leaves( BaseMatch.KeyWord("=").add_leaves( 
            BaseMatch.AnyString().add_leaves( 
                BaseMatch.KeyWord(",").add_leaves(*hasitem),
                BaseMatch.KeyWord("}").add_leaves(*end_node)
            )
        ))
        hasitem[1].add_leaves( BaseMatch.KeyWord("=").add_leaves( 
            BaseMatch.Int().add_leaves( 
                BaseMatch.KeyWord(",").add_leaves(*hasitem),
                BaseMatch.KeyWord("}").add_leaves(*end_node)
            )
        ))
        hasitem[2].add_leaves( BaseMatch.KeyWord("=").add_leaves( 
            *Range_Tree( 
                BaseMatch.KeyWord(",").add_leaves(*hasitem),
                BaseMatch.KeyWord("}").add_leaves(*end_node)
            )
        ))
        hasitem[3].add_leaves( BaseMatch.KeyWord("=").add_leaves( 
            BaseMatch.Enum(
                "slot.weapon.mainhand","slot.weapon.offhand",
                "slot.armor.head","slot.armor.chest","slot.armor.legs","slot.armor.feet",
                "slot.enderchest","slot.hotbar","slot.inventory","slot.saddle","slot.armor",
                "slot.armor","slot.chest","slot.equippable"
            ).add_leaves( 
                BaseMatch.KeyWord(",").add_leaves(*hasitem),
                BaseMatch.KeyWord("}").add_leaves(*end_node)
            )
        ))
        hasitem[4].add_leaves( BaseMatch.KeyWord("=").add_leaves( 
            *Range_Tree( 
                BaseMatch.KeyWord(",").add_leaves(*hasitem),
                BaseMatch.KeyWord("}").add_leaves(*end_node)
            )
        ))
        return BaseMatch.KeyWord("{").add_leaves(*hasitem)

    def middle_hasitem_multiple_args_loop(*end_node:BaseMatch.Match_Base) :
        hasitem1 = BaseMatch.KeyWord("[")
        m1 = BaseMatch.KeyWord(",")
        hasitem2 = middle_hasitem_single_args_loop( 
            m1, BaseMatch.KeyWord("]").add_leaves(*end_node)
        )
        m1.add_leaves(hasitem2)
        return hasitem1.add_leaves(hasitem2)


    Selector_Var2 : List[BaseMatch.Match_Base] = [
        BaseMatch.Enum("x","y","z"),    # 0
        BaseMatch.Enum("dx","dy","dz"), # 1
        BaseMatch.Enum("r","rm"),       # 2
        BaseMatch.Enum("rx","rxm"),     # 3
        BaseMatch.Enum("ry","rym"),     # 4
        BaseMatch.Char("l","lm"),       # 5
        BaseMatch.Char("c"),            # 6
        BaseMatch.Char("type"),         # 7
        BaseMatch.Char("m"),            # 8
        BaseMatch.Enum("tag","name","family"), # 9
        BaseMatch.Char("scores"),       # 10
        BaseMatch.Char("haspermission"),# 11
        BaseMatch.Char("hasitem")       # 12
    ]


    Selector_Var2[0].add_leaves( BaseMatch.KeyWord("=").add_leaves( Relative_Offset_Float().add_leaves(
            BaseMatch.KeyWord(",").add_leaves(*Selector_Var2),
            BaseMatch.KeyWord("]").add_leaves(*end_node)
        ),
    ))
    Selector_Var2[1].add_leaves( BaseMatch.KeyWord("=").add_leaves( BaseMatch.Float().add_leaves(
        BaseMatch.KeyWord(",").add_leaves(*Selector_Var2),
        BaseMatch.KeyWord("]").add_leaves(*end_node)
    )))
    Selector_Var2[2].add_leaves( BaseMatch.KeyWord("=").add_leaves( BaseMatch.Float().add_leaves(
        BaseMatch.KeyWord(",").add_leaves(*Selector_Var2),
        BaseMatch.KeyWord("]").add_leaves(*end_node)
    )))
    Selector_Var2[3].add_leaves( BaseMatch.KeyWord("=").add_leaves( BaseMatch.Float().add_leaves(
        BaseMatch.KeyWord(",").add_leaves(*Selector_Var2),
        BaseMatch.KeyWord("]").add_leaves(*end_node)
    )))
    Selector_Var2[4].add_leaves( BaseMatch.KeyWord("=").add_leaves( BaseMatch.Float().add_leaves(
        BaseMatch.KeyWord(",").add_leaves(*Selector_Var2),
        BaseMatch.KeyWord("]").add_leaves(*end_node)
    )))
    Selector_Var2[5].add_leaves( BaseMatch.KeyWord("=").add_leaves( BaseMatch.Int().add_leaves(
        BaseMatch.KeyWord(",").add_leaves(*Selector_Var2),
        BaseMatch.KeyWord("]").add_leaves(*end_node)
    )))
    Selector_Var2[6].add_leaves( BaseMatch.KeyWord("=").add_leaves( BaseMatch.Int().add_leaves(
        BaseMatch.KeyWord(",").add_leaves(*Selector_Var2),
        BaseMatch.KeyWord("]").add_leaves(*end_node)
    )))
    Selector_Var2[7].add_leaves( BaseMatch.KeyWord("=").add_leaves( 
        BaseMatch.AnyString().add_leaves(
            BaseMatch.KeyWord(",").add_leaves(*Selector_Var2),
            BaseMatch.KeyWord("]").add_leaves(*end_node)
        ),
        BaseMatch.KeyWord("!").add_leaves( BaseMatch.AnyString().add_leaves(
            BaseMatch.KeyWord(",").add_leaves(*Selector_Var2),
            BaseMatch.KeyWord("]").add_leaves(*end_node)
        )),
    ))
    Selector_Var2[8].add_leaves( BaseMatch.KeyWord("=").add_leaves(
            BaseMatch.Enum("0","survival","s","1","creative","c","2","adventure","a","spectator").add_leaves(
            BaseMatch.KeyWord(",").add_leaves(*Selector_Var2),
            BaseMatch.KeyWord("]").add_leaves(*end_node)
        ),
        BaseMatch.KeyWord("!").add_leaves( 
            BaseMatch.Enum("0","survival","s","1","creative","c","2","adventure","a","spectator").add_leaves(
            BaseMatch.KeyWord(",").add_leaves(*Selector_Var2),
            BaseMatch.KeyWord("]").add_leaves(*end_node)
        )
    )))
    Selector_Var2[9].add_leaves( BaseMatch.KeyWord("=").add_leaves( 
        BaseMatch.KeyWord("!").add_leaves( 
            BE_String().add_leaves(
                BaseMatch.KeyWord(",").add_leaves(*Selector_Var2),
                BaseMatch.KeyWord("]").add_leaves(*end_node)
            ),
            BE_Quotation_String().add_leaves(
                BaseMatch.KeyWord(",").add_leaves(*Selector_Var2),
                BaseMatch.KeyWord("]").add_leaves(*end_node)
            )
        ),
        BE_String().add_leaves(
            BaseMatch.KeyWord(",").add_leaves(*Selector_Var2),
            BaseMatch.KeyWord("]").add_leaves(*end_node)
        ),
        BE_Quotation_String().add_leaves(
            BaseMatch.KeyWord(",").add_leaves(*Selector_Var2),
            BaseMatch.KeyWord("]").add_leaves(*end_node)
        )
    ))
    Selector_Var2[10].add_leaves( BaseMatch.KeyWord("=").add_leaves( middle_scores_loop(
        BaseMatch.KeyWord(",").add_leaves(*Selector_Var2),
        BaseMatch.KeyWord("]").add_leaves(*end_node)
    )))
    Selector_Var2[11].add_leaves( BaseMatch.KeyWord("=").add_leaves( middle_haspermission_loop(
        BaseMatch.KeyWord(",").add_leaves(*Selector_Var2),
        BaseMatch.KeyWord("]").add_leaves(*end_node)
    )))
    Selector_Var2[12].add_leaves( BaseMatch.KeyWord("=").add_leaves( 
        middle_hasitem_multiple_args_loop(
            BaseMatch.KeyWord(",").add_leaves(*Selector_Var2),
            BaseMatch.KeyWord("]").add_leaves(*end_node)
        ),
        middle_hasitem_single_args_loop(
            BaseMatch.KeyWord(",").add_leaves(*Selector_Var2),
            BaseMatch.KeyWord("]").add_leaves(*end_node)
        )
    ))


    Selector : List[BaseMatch.Match_Base] = [
        BaseMatch.KeyWord("@p","@a","@r","@s","@e","@initiator").add_leaves(
            BaseMatch.KeyWord("[").add_leaves(*Selector_Var2),
            *end_node
        ),
        BE_String().add_leaves(*end_node),
        BE_Quotation_String().add_leaves(*end_node)
    ]
    return Selector






