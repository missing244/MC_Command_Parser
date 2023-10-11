
import * as re from "./command_parser_js/RegExp.js";
import * as BaseMatch from "./command_parser_js/base_match_class.js";
import * as SpecialMatch from "./command_parser_js/special_match.js";
import {Command_Parser} from "./command_parser_js/parser_system.js";


const command_ability = new SpecialMatch.Command_Root()
command_ability.add_leaves(
    new BaseMatch.Char("ability").add_leaves(
        ...SpecialMatch.BE_Selector_Tree(
            new BaseMatch.Enum("worldbuilder","mayfly","mute").add_leaves(
                new BaseMatch.Enum("true","false").add_leaves( new BaseMatch.End_Tag() ),
                new BaseMatch.End_Tag()
            )
        )
    ),
    new BaseMatch.Char("say").add_leaves( new BaseMatch.AnyString() ),
    new BaseMatch.Char("execute"),
)
command_ability.tree_leaves[2].add_leaves(
    ...SpecialMatch.BE_Selector_Tree(
        ...SpecialMatch.Pos_Tree(
            ...command_ability.tree_leaves
        )
    )
)



const str1 = 'execute @a[tag="abc \\",d=e] ~~~ say hello " ] ^^121^123 execute @s 123~123 123 say world'
const a = new Command_Parser(command_ability)

console.log([str1]);
console.log(re.compile("(\\^)[-\\+]?[0-9\\.]{0,}").match("^+11"))
try { console.log( a.parser(str1) ) ; console.log( a.Token_list ) }
catch (e) { 
    throw e
    console.log( e.pos )
    console.log( e.word )
    console.log( a.Token_list ) 
}