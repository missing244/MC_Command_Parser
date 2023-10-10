
import * as re from "./command_parser_js/RegExp.js";
import * as BaseMatch from "./command_parser_js/base_match_class.js";
import * as SpecialMatch from "./command_parser_js/special_match.js";
import {Command_Parser} from "./command_parser_js/parser_system.js";


const command_ability = new SpecialMatch.Command_Root().add_leaves(
    new BaseMatch.Char("ability").add_leaves(
        ...SpecialMatch.BE_Selector_Tree(
            new BaseMatch.Enum("worldbuilder","mayfly","mute").add_leaves(
                new BaseMatch.Enum("true","false").add_leaves( new BaseMatch.End_Tag() ),
                new BaseMatch.End_Tag()
            )
        )
    )
)


const str1 = 'ability   @e  [rm=-1.,scores={aaa=1, "2"=..1, "8"=!1..1}] mute true'
const a = new Command_Parser(command_ability)

console.log([str1]);
try { console.log( a.parser(str1) ) }
catch (e) { 
    throw e
    console.log( e.pos )
    console.log( e.word )
    console.log( a.Token_list ) 
}