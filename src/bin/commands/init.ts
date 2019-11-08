import { Arguments, Argv } from 'yargs';
import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import walkSync from 'walk-sync';
import { PROJECT_TEMPLATE_DIRNAME } from '../utils/constants';

interface InitArgv {
  'project-directory': string;
}

/**
 * Paths to ignore by default when copying from `project-template`
 */
const IGNORE_PATHS = ['node_modules', 'package.json'];

/**
 * Initialize Typescript project.
 * @param argv arguments passed to `init` command
 */
function initProject(argv: Arguments<InitArgv>): void {
  const { 'project-directory': outDir } = argv;
  const projectName = path.basename(outDir);

  // if folder exists and has contents, abort.
  if (fs.existsSync(outDir) && !!fs.readdirSync(outDir).length) {
    console.error(chalk.yellow(`${outDir} already exists and is not empty.`));
    console.error(chalk.red(`Specify an empty project directory.`));
    process.exit(1);
  }

  const projectTemplateDir = path.resolve(PROJECT_TEMPLATE_DIRNAME);
  const templatePackageJson = require(path.join(
    projectTemplateDir,
    'package.json',
  ));

  templatePackageJson.name = projectName;

  IGNORE_PATHS.concat(templatePackageJson.files || []); // add `files` from package.json to exclude from copySync
  fs.ensureDir(outDir); // ensure outDir exists

  console.log(chalk.white('Generating files in', outDir));

  // copy files from `project-template`
  walkSync(projectTemplateDir, {
    includeBasePath: false,
    ignore: IGNORE_PATHS,
    directories: false,
  }).forEach(filePath => {
    console.log(chalk.green(filePath));
    fs.copySync(
      path.join(projectTemplateDir, filePath),
      path.join(outDir, filePath),
    );
  });
  // write package
  fs.writeJSONSync(path.join(outDir, 'package.json'), templatePackageJson);

  console.log(chalk.white(`Generation complete`));
}

module.exports = {
  command: 'init <project-directory>',
  aliases: ['i'],
  describe: 'Initialize a new SemVer Typescript Project',
  builder: (yargs: Argv): void => {
    yargs.positional('project-directory', {
      describe: 'directory to generate project in',
      type: 'string',
      coerce: path.resolve,
    });
  },
  handler: initProject,
};
