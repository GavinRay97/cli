import { ICompiler } from "../../interfaces/ICompiler";
import { TypescriptCompiler } from "./tsCompiler";
import * as _ from "lodash";
import { Context } from "../../common/context";

export function getCompiler(files: string[], context: Context): ICompiler {
    return new TypescriptCompiler(files, context);
}