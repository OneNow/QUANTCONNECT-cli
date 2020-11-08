import { APIClient } from '../api/APIClient';
import { logger } from './logger';
import { sleep } from './promises';

export async function compileProject(api: APIClient, project: QCProject): Promise<QCCompile> {
  let compile = await api.compiles.create(project.projectId);
  logger.info(`Started compiling project '${project.name}'`);

  const parameters: string[] = [];
  for (const container of compile.parameters) {
    for (const parameter of container.parameters) {
      parameters.push(`- ${container.file}:${parameter.line} :: ${parameter.type}`);
    }
  }

  if (parameters.length > 0) {
    logger.info(`Detected parameters (${parameters.length}):`);

    for (const parameter of parameters) {
      logger.info(parameter);
    }
  } else {
    logger.info('Detected parameters: none');
  }

  while (true) {
    compile = await api.compiles.get(project.projectId, compile.compileId);

    if (compile.state === 'BuildSuccess' || compile.state === 'BuildError') {
      break;
    }

    await sleep(250);
  }

  if (compile.state === 'BuildError') {
    logger.error(compile.logs.join('\n'));
    throw new Error(`Something went wrong while compiling project '${project.name}'`);
  }

  logger.info(compile.logs.join('\n'));
  logger.info(`Successfully compiled project '${project.name}'`);

  return compile;
}
