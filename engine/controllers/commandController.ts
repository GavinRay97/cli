import { Utils, StaticConfig } from "../../common";
import * as path from "path";
import * as _ from "lodash";
import * as fs from "fs";
import { Context, Translations } from "../../common/Context";
import * as yargs from "yargs";


export class CommandController {

  private static instanceCommand(fullPath: string): any {
    try {
      try {
        return Utils.undefault(require(require.resolve(fullPath)));
      } catch(ex) {
        console.log(ex.message);
      }

    } catch (error) {
      throw new Error("Command \"" + path.basename(fullPath) + "\" is invalid");
    }
  }

  static parseError = (error: any) => {
    if (error.response && error.response.errors.length > 0 && error.response.errors[0].message) {
      return error.response.errors[0].message;
    } else {
      return error.message;
    }
  }

  static wrapBuilder = (builder: Function, translations: Translations) => {
    return (params: yargs.Argv): yargs.Argv => {
      return builder(params, translations);
    };
  };

  static wrapHandler = (handler: Function, translations: Translations) => {
    return async (params: any) => {
      const command = params._[0];

      const context = new Context(params, translations);

      try {

        const start = Date.now();
        await handler(params, context);
        context.spinner.stop();

        const time = Date.now() - start;

        context.logger.info(context.i18n.t("success_command_end", { command, time }));

      } catch(ex) {
        context.spinner.stop();
        context.logger.error(context.i18n.t("error_command_end", { command, error: CommandController.parseError(ex) }));
      }
    };
  };

  static enumerate(): any[] {
    return _.transform(fs.readdirSync(StaticConfig.commandsDir), (commands, file: string) => {
      const p = path.join(StaticConfig.commandsDir, file);
      if (fs.statSync(p).isDirectory()) {
        commands.push(this.instanceCommand(p));
      }
    }, []);
  }
}
