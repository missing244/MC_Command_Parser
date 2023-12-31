from command_parser import BaseMatch,SpecialMatch,ParserSystem
import time

command_ability = SpecialMatch.Command_Root().add_leaves(
    BaseMatch.Char("Command:","ability").add_leaves(
        *SpecialMatch.BE_Selector_Tree(
            BaseMatch.Enum("Ability_Argument","worldbuilder","mayfly","mute").add_leaves(
                BaseMatch.Enum("Value","true","false").add_leaves( BaseMatch.End_Tag() ),
                BaseMatch.End_Tag()
            )
        )
    ),
    BaseMatch.Char("Command","say").add_leaves( BaseMatch.AnyMsg("Say_Msg") ),
    BaseMatch.Char("Command","execute"),
)
command_ability.tree_leaves[2].add_leaves(
    *SpecialMatch.BE_Selector_Tree(
        *SpecialMatch.Pos_Tree(
            *command_ability.tree_leaves
        )
    )
)



str1 = 'ability   @e  [rm=-1.,scores={"1"=1, "2"=..1, "3"=1.., "4"=1..1, "5"=!1, "6"=!..1, "7"=!1.., "8"=!1..1}]'
a = ParserSystem.Command_Parser(command_ability)
t1 = time.time()
for i in range(1) : print(a.parser(str1))
print(a.Token_list)
print(time.time() - t1)
exit()
print(
  a.parser(str1)[0].word, "\n",
  a.parser(str1)[0].pos, "\n",
)
print(str1[44:45])












