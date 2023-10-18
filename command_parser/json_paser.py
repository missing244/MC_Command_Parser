import re,abc
from typing import Dict,Union,List,Tuple

from . import base_match_class as BaseMatch
from . import special_match as SpecialMatch

class Not_Parser_Object(Exception) : pass

class Json_Error(BaseMatch.Command_Match_Exception) : pass



class Json_Match_Base(metaclass=abc.ABCMeta) :
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
        self.tree_leaves : List[Json_Match_Base] = []

    def __repr__(self) -> str:
        return self.__class__.__name__
        
    def add_leaves(self,*obj) :
        for i in obj :
            if not isinstance(i,Json_Match_Base) : 
                raise Not_Parser_Object("%s 为非JSON匹配对象" % i)
            self.tree_leaves.append(i)
        return self

    @abc.abstractmethod
    def _match_string(self,s:str,s_pointer:int) -> re.Match : pass
    
    @abc.abstractmethod
    def _auto_complete(self) -> List[str] : pass

class Json_Value_Tag(Json_Match_Base) :
    def _match_string(self) : pass
    def _auto_complete(self) : pass















