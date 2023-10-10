"""
最原始的匹配类
"""



import re,abc
from typing import Dict,Union,List,Tuple

__all__ = ["Match_Base","Enum","Char","KeyWord","Int","Float"]

class Not_Match_Object(Exception) : pass
class Command_Match_Exception(Exception) :
    def __init__(self, *args, **kargs) :
        super().__init__(*args)
        for i in kargs : self.__setattr__(i,kargs[i])

class Not_Match(Command_Match_Exception) : pass
class To_Many_Args(Command_Match_Exception) : pass


def string_to_rematch(s:str) -> str :
    """将字符串转换为合法的正则表达式"""
    s_list = [ "\\u" + ("000%s" % hex( ord(i)).replace("0x","",1) )[-4:] for i in s]
    return "".join(s_list)

TERMINATOR_RE = string_to_rematch(' ,@~^$&"!#%+*/=[{]}\|<>`')


class Match_Base(metaclass=abc.ABCMeta) :
    '''
    匹配对象基类
    ------------------
    你不应该直接使用这个类\n
    ------------------------------------
    所有从此基类继承的类都有以下公用方法\n
    add_leaves : 添加同级的命令分支\n
    ------------------------------------
    提供给开发者重写的方法\n
    _match_string : 提供自动补全的字符串列表，必须写明传参s、s_pointer，s是源字符串，s_pointer是源字符串当前匹配停止的位置
    _auto_complete : 提供自动补全的字符串列表
    '''

    def __init__(self) -> None :
        self.tree_leaves : List[Match_Base] = []

    def __repr__(self) -> str:
        return self.__class__.__name__
        
    def add_leaves(self,*obj) :
        for i in obj :
            if not isinstance(i,Match_Base) : 
                raise Not_Match_Object("%s 为非匹配对象" % i)
            self.tree_leaves.append(i)
        return self

    @abc.abstractmethod
    def _match_string(self,s:str,s_pointer:int) -> re.Match : pass
    
    @abc.abstractmethod
    def _auto_complete(self) -> List[str] : pass

class End_Tag(Match_Base) :
    """
    命令结束标志
    ------------------------------
    在下一次匹配中，应该无法匹配到任何除分隔符(例如空格)以外的字符\n
    ------------------------------
    实例化参数\n
    >>> End_Tag()
    """
    
    def __init__(self) -> None :
        super().__init__()
        self.re_match = re.compile(".{0,}")

    def _match_string(self, s:str, s_pointer:int): 
        _match = self.re_match.match(s, pos=s_pointer)
        if _match and _match.group().__len__() > 0 : 
            raise To_Many_Args(">>%s<< 多余的参数" % _match.group(), pos=(_match.start(),_match.end()), word=_match.group())

    def _auto_complete(self) -> List[str] : return []


class Enum(Match_Base) :
    """
    枚举值
    ------------------------------
    在下一次匹配中，只能匹配到 s 参数提供的字符串\n
    ------------------------------
    实例化参数\n
    *s : 所有可以匹配的字符串\n
    terminator : 匹配停止的所有字符\n
    >>> Enum("ab","cd","ef")
    """
    
    def __repr__(self) -> str:
        return str(self.re_test)
    
    def __init__(self, *s:str, terminator:str=TERMINATOR_RE) -> None :
        for i in s :
            if not isinstance(i,str) : raise TypeError("s 提供字符串以外的参数")
        if not isinstance(terminator,str) : raise TypeError("terminator 提供字符串以外的参数")
        super().__init__()
        self.base_input = s
        self.re_match = re.compile("[^%s]{0,}" % terminator)
        self.re_test  = re.compile("^(%s)$" % "|".join([string_to_rematch(i) for i in s])) 

    def _match_string(self,s:str,s_pointer:int): 
        _match = self.re_match.match(s,pos=s_pointer)
        if not self.re_test.search(_match.group()) : 
            raise Not_Match(">>%s<< 并不是有效字符" % _match.group(), pos=(_match.start(),_match.end()), word=_match.group())
        return _match

    def _auto_complete(self) -> List[str]: 
        return list(self.base_input)

class Char(Match_Base) :
    """
    字符串
    ------------------------------
    在下一次匹配中，只能匹配到 s 参数提供的字符串\n
    ------------------------------
    实例化参数\n
    s : 可以匹配到的字符串\n
    terminator : 匹配停止的所有字符\n
    >>> Char("ab")
    """
    def __repr__(self) -> str:
        return str(self.re_test)
    
    def __init__(self, s:str, terminator:str=TERMINATOR_RE) -> None :
        if not isinstance(s,str) : raise TypeError("s 提供字符串以外的参数")
        if not isinstance(terminator,str) : raise TypeError("terminator 提供字符串以外的参数")
        super().__init__()
        self.base_input = s
        self.re_match = re.compile("[^%s]{0,}" % terminator)
        self.re_test  = re.compile("^(%s)$" % string_to_rematch(s)) 

    def _match_string(self,s:str,s_pointer:int): 
        _match = self.re_match.match(s,pos=s_pointer)
        if not self.re_test.search(_match.group()) : 
            raise Not_Match(">>%s<< 并不是有效字符" % _match.group(), pos=(_match.start(),_match.end()), word=_match.group())
        return _match

    def _auto_complete(self) -> List[str] : 
        return [self.base_input]

class KeyWord(Match_Base) :
    """
    关键字符
    ------------------------------
    在下一次匹配中，必须匹配到 s 参数提供的字符串\n
    但是匹配器传入的字符串阅读指针，一定跳过分隔符字符，例如命令中的空格\n
    ------------------------------
    实例化参数\n
    *s : 可以匹配的所有字符串\n
    >>> KeyWord("[")
    """
    def __repr__(self) -> str:
        return str(self.re_test)

    def __init__(self, *s:str) -> None :
        for i in s :
            if not isinstance(i,str) : raise TypeError("s 提供字符串以外的参数")
        super().__init__()
        self.base_input = s
        self.re_match   = [re.compile(".{1,%s}" % len(i)) for i in s]
        self.re_test    = re.compile( "|".join( [string_to_rematch(i) for i in s] ) )

    def _match_string(self,s:str,s_pointer:int) : 
        _match = [i.match(s,pos=s_pointer) for i in self.re_match]
        a = [self.re_test.search(i.group()) for i in _match]
        if not any(a) : raise Not_Match(">>%s<< 并不是有效的字符" % _match[0].group(), 
            pos=(_match[0].start(),_match[0].end()), word=_match[0].group())
        b = [i.group().__len__() for i in a if (i)]
        return _match[b.index(max(b))]

    def _auto_complete(self) -> List[str] : 
        return list(self.base_input)

class Int(Match_Base) :
    """
    整数
    ------------------------------
    在下一次匹配中，需要匹配到合法的整数\n
    ------------------------------
    实例化参数\n
    terminator : 匹配停止的所有字符\n
    *unit_word : 所有可匹配的单位字符串\n
    >>> Int("L","D")
    """

    def __init__(self, *unit_word:str, terminator:str=TERMINATOR_RE) -> None :
        if not isinstance(terminator,str) : raise TypeError("terminator 提供字符串以外的参数")
        for i in unit_word :
            if not isinstance(i,str) : raise TypeError("unit_word 提供字符串以外的参数")
        super().__init__()
        self.re_match = re.compile("[^%s]{0,}" % terminator)
        self.re_test  = re.compile("^(-+)?[0-9]{1,}$")
        self.unit_word = unit_word
        self.unit_word_test  = re.compile("(%s)$" % "|".join([string_to_rematch(i) for i in unit_word])) if unit_word else None

    def _match_string(self,s:str,s_pointer:int) : 
        _match = self.re_match.match(s,pos=s_pointer)
        if self.unit_word_test : 
            b = self.unit_word_test.search(_match.group())
            if not b : raise Not_Match(">>%s<< 并不具有有效的整数单位" % _match.group(), pos=(_match.start(),_match.end()), word=_match.group())
            a = self.re_test.search(_match.group()[0:b.start()])
        else : a = self.re_test.search(_match.group())
        if not a : raise Not_Match(">>%s<< 并不是有效的整数" % _match.group(), pos=(_match.start(),_match.end()), word=_match.group())
        return _match

    def _auto_complete(self) -> List[str]: 
        if self.unit_word : return [(str("0" + i)) for i in self.unit_word]
        else : return ["0"]

class Float(Match_Base) :
    """
    浮点数
    ------------------------------
    在下一次匹配中，需要匹配到合法的浮点数\n
    ------------------------------
    实例化参数\n
    terminator : 匹配停止的所有字符\n
    *unit_word : 所有可匹配的单位字符串\n
    >>> Float("L","D")
    """
    
    def __init__(self, *unit_word:str, terminator:str=TERMINATOR_RE) -> None :
        if not isinstance(terminator,str) : raise TypeError("terminator 提供字符串以外的参数")
        for i in unit_word :
            if not isinstance(i,str) : raise TypeError("unit_word 提供字符串以外的参数")
        super().__init__()
        self.re_match = re.compile("[^%s]{0,}" % terminator)
        self.re_test  = re.compile("^[-+]?([0-9]{0,}\\.[0-9]{1,}|[0-9]{1,}\\.[0-9]{0,}|[0-9]{1,})$") 
        self.unit_word = unit_word
        self.unit_word_test  = re.compile("(%s)$" % "|".join([string_to_rematch(i) for i in unit_word])) if unit_word else None

    def _match_string(self,s:str,s_pointer:int): 
        _match = self.re_match.match(s,pos=s_pointer)
        if self.unit_word_test : 
            b = self.unit_word_test.search(_match.group())
            if not b : raise Not_Match(">>%s<< 并不具有有效的整数单位" % _match.group(), pos=(_match.start(),_match.end()), word=_match.group())
            a = self.re_test.search(_match.group()[0:b.start()])
        else : a = self.re_test.search(_match.group())
        if not a : raise Not_Match(">>%s<< 并不是有效的浮点数" % _match.group(), pos=(_match.start(),_match.end()), word=_match.group())
        return _match

    def _auto_complete(self) -> List[str] : 
        if self.unit_word : return [("0" + i) for i in self.unit_word]
        else : return ["0"]


class AnyString(Match_Base) :
    """
    任意字符串
    ------------------------------
    在下一次匹配中，尽可能尝试匹配到更多的，连续的非终止字符\n
    适用于Minecraft ID\n
    ------------------------------
    实例化参数\n
    terminator : 匹配停止的所有字符\n
    atuo_complete : 自动提示将会提示的内容\n
    >>> AnyString()
    """
    
    def __init__(self, terminator:str=TERMINATOR_RE, atuo_complete:List[str]=[]) -> None :
        if not isinstance(terminator,str) : raise TypeError("terminator 提供字符串以外的参数")
        super().__init__()
        self.re_match = re.compile("[^%s]{0,}" % terminator)
        self.atuo_complete = atuo_complete

    def _match_string(self, s:str, s_pointer:int): 
        _match = self.re_match.match(s, pos=s_pointer)
        return _match

    def _auto_complete(self) -> List[str] : 
        return self.atuo_complete





if __name__ == "__main__" :
    print(string_to_rematch("\""))
    a = Int()._match_string("a  +1213123123  c",3)
    print(a)