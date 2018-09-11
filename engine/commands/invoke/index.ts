import * as yargs from "yargs";
import { Context } from "../../../common/Context";
import _ = require("lodash");
import { GraphqlActions } from "../../../consts/GraphqlActions";


export default {
  name: "invoke",
  handler: async (params: any, context: Context) => {
    const args = params.i ? params.i
      : params.p ? fs.readFileSync(params.p) : null;

    const serilizedArgs = _.escape(JSON.stringify(JSON.parse(args)));

    const result = await context.request(GraphqlActions.invoke, { data: { functionName: params.n, inputArgs: serilizedArgs } });

    context.logger.info(_.unescape(result.invoke.responseData));
  },
  describe: 'Invoke function remotely',
  builder: (args: yargs.Argv): yargs.Argv => {
    return args
      .usage("8base invoke [OPTIONS]")
      .option("n", {
        alias: 'name',
        require: true,
        type: "string",
        describe: "function name"
      })
      .option("i", {
        alias: 'input',
        describe: "function input data",
        type: "string"
      })
      .option("p", {
        alias: 'path',
        describe: "path to file with function input data",
        type: "string"
      });
  }
};
