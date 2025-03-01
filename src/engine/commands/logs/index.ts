import * as yargs from "yargs";
import { Context } from "../../../common/context";
import _ = require("lodash");
import { GraphqlActions } from "../../../consts/GraphqlActions";
import { translations } from "../../../common/translations";

const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

let lastMessage: string = "";

const filterMessage = (messages: string[]): string[] => {
  const index = messages.indexOf(lastMessage);

  if (index === -1) {
    lastMessage = messages.length > 0 ? _.last(messages) : "";
    return messages;
  }

  if (index + 1 === messages.length) {
    return [];
  }

  lastMessage = _.last(messages);
  return _.slice(messages, index);
};

const readLogs = async (functionName: string, context: Context) => {
  let attempt = 0;
  let error = null;

  while (error === null) {
    const MS_PER_MINUTE = 60000;
    const minutes = 3;
    const start = new Date(Date.now() - minutes * MS_PER_MINUTE);

    if (attempt === 0) {
      context.spinner.start(translations.i18n.t("logs_tail_in_progress"));
    }

    let result;

    try {
      result = await context.request(GraphqlActions.logs, { functionName, startTime: start.toISOString() });
    } catch (e) {
      error = e;
    }

    if (attempt === 0) {
      context.spinner.stop();

      if (error) {
        context.logger.error(translations.i18n.t("logs_tail_failed"));
        continue;
      } else {
        context.logger.info(translations.i18n.t("logs_tail_success"));
      }
    }

    const logs = filterMessage(result.logs);

    if (logs.length > 0) {
      context.logger.info(logs);
    }

    await sleep(1000);
    attempt = attempt + 1;
  }
};

export default {
  command: "logs [name]",
  handler: async (params: any, context: Context) => {
    if (params.n > 100) {
      params.n = 100;
    }

    if (params["t"] ) {
      return await readLogs(params.name, context);
    }

    context.spinner.start(context.i18n.t("logs_in_progress"));

    const result = await context.request(GraphqlActions.logs, { functionName: params.name, limit: params.n });
    context.spinner.stop();
    context.logger.info(result.logs);
  },
  describe: translations.i18n.t("logs_describe"),
  builder: (args: yargs.Argv): yargs.Argv => {
    return args
      .usage(translations.i18n.t("logs_usage"))
      .positional("name", {
        describe: translations.i18n.t("logs_name_describe"),
        type: "string",
      })
      .demandOption("name")
      .option("num", {
        alias: "n",
        default: 10,
        describe: translations.i18n.t("logs_num_describe"),
        type: "number",
      })
      .option("tail", {
        alias: "t",
        describe: translations.i18n.t("logs_tail_describe"),
        type: "boolean"
      });
  }
};
