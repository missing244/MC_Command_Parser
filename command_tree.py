import command_parser.base_match_class as BaseMatch
import command_parser.special_match as SpecialMatch
from command_parser.parser_system import Command_Parser


command_ability = SpecialMatch.Command_Root().add_leaves(
    BaseMatch.Char("ability").add_leaves(
        *SpecialMatch.BE_Selector_Tree(
            BaseMatch.Enum("worldbuilder","mayfly","mute").add_leaves(
                BaseMatch.Enum("true","false").add_leaves( BaseMatch.End_Tag() ),
                BaseMatch.End_Tag()
            )
        )
    )
)



str1 = 'ability   @e  [rm=-1.,scores={"1"=1, "2"=..1, "3"=1.., "4"=1..1, "5"=!1, "6"=!..1, "7"=!1.., "8"=!1..1}] mute true'
a = Command_Parser(command_ability)
print(
  a.parser(str1), "\n",
)
exit()
print(
  a.parser(str1)[0].word, "\n",
  a.parser(str1)[0].pos, "\n",
)
print(str1[44:45])












