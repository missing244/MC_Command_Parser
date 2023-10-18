
import * as BaseMatch from "./base_match_class.js";
import * as SpecialMatch from "./special_match.js";
import * as ParserSystem from "./parser_system.js";


export const be_command_tree = new SpecialMatch.Command_Root().add_leaves(
    new BaseMatch.Char("Command","ability").add_leaves(
        ...SpecialMatch.BE_Selector_Tree(
            new BaseMatch.Enum("Ability_Argument","worldbuilder","mayfly","mute").add_leaves(
                new BaseMatch.Enum("Value","true","false").add_leaves( new BaseMatch.End_Tag() ),
                new BaseMatch.End_Tag()
            )
        )
    ),
    new BaseMatch.Char("Command","alwaysday").add_leaves( new BaseMatch.Enum("Value","true","false").add_leaves( new BaseMatch.End_Tag() ) ),
    new BaseMatch.Char("Command","camera").add_leaves(
        ...SpecialMatch.BE_Selector_Tree(
            new BaseMatch.Char("Camera_Argument","clear").add_leaves( new BaseMatch.End_Tag() ),
            new BaseMatch.Char("Camera_Argument","fade").add_leaves( 
                new BaseMatch.Char("Camera_Color","color").add_leaves(
                    new BaseMatch.Int("Color_Red").add_leaves( 
                        new BaseMatch.Int("Color_Green").add_leaves( 
                            new BaseMatch.Int("Color_Blue").add_leaves().add_leaves( new BaseMatch.End_Tag() 
                            )
                        )
                    )
                ),
                new BaseMatch.Char("Camera_Time","time").add_leaves(
                    new BaseMatch.Float("Fade_In").add_leaves(
                        new BaseMatch.Float("Hold").add_leaves(
                            new BaseMatch.Float("Fade_Out").add_leaves(
                                
                            )
                        )
                    )
                ),
                new BaseMatch.End_Tag()
            ),
        )
    ),







    new BaseMatch.Char("Command","say").add_leaves( new BaseMatch.AnyMsg("Msg").add_leaves( new BaseMatch.End_Tag() ) ),
    new BaseMatch.Char("Command","daylock").add_leaves( new BaseMatch.Enum("Value","true","false").add_leaves( new BaseMatch.End_Tag() ) ),

















    new BaseMatch.Char("Command","execute"),
)
be_command_tree.tree_leaves[be_command_tree.tree_leaves.length - 1].add_leaves(
    ...SpecialMatch.BE_Selector_Tree(
        ...SpecialMatch.Pos_Tree(
            ...be_command_tree.tree_leaves
        )
    )
)



const str1 = 'execute @a[tag="abcd\\\\\\"\\\\",h'
const a = new ParserSystem.Command_Parser(be_command_tree)

console.log(str1);
console.log( a.parser(str1) )
console.log( a.Token_list )