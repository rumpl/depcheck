import fs from 'fs';
import path from 'path';
import lodash from 'lodash';

import depcheck from './index';
import { version, name } from '../package.json';
import { getConfiguration } from './utils/configuration-reader';
import findLineInFile from './utils/find-line-in-file';

function checkPathExist(dir, errorMessage) {
  return new Promise((resolve, reject) =>
    fs.exists(dir, (result) => (result ? resolve() : reject(errorMessage))),
  );
}

function getParsers(parsers) {
  if (!parsers) {
    return undefined;
  }

  const parserTuples = Object.entries(parsers).map(
    ([extension, parserNames]) => {
      // parserNames might not be an array due to user error when creating a configuration file.
      // Example of a configuration file where this might happen:
      // {
      //   parsers: {
      //     "*.js" : "es6",
      //     "*.jsx": ["jsx"]
      //   }
      // }
      const sanitizedParserNames = Array.isArray(parserNames)
        ? parserNames
        : [parserNames];
      const parserLambdas = sanitizedParserNames.map(
        (parserName) => depcheck.parser[parserName],
      );
      return [extension, parserLambdas];
    },
  );

  return lodash.fromPairs(parserTuples);
}

function getDetectors(detectors) {
  return lodash.isUndefined(detectors)
    ? undefined
    : detectors.map((detectorName) => depcheck.detector[detectorName]);
}

function getSpecials(specials) {
  return lodash.isUndefined(specials)
    ? undefined
    : specials.map((specialName) => depcheck.special[specialName]);
}

function noIssue(result) {
  return (
    lodash.isEmpty(result.dependencies) &&
    lodash.isEmpty(result.devDependencies) &&
    lodash.isEmpty(result.missing)
  );
}

function prettify(
  caption,
  deps,
  oneline,
  rootDir = null,
  printJsonLineInKey = null,
) {
  if (oneline) {
    return deps.length ? [caption, deps.join(' ')] : [];
  }

  const packageJson =
    rootDir && printJsonLineInKey
      ? fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8')
      : null;

  const list = deps.map((dep) => {
    const lineNumber =
      packageJson &&
      printJsonLineInKey &&
      findLineInFile(packageJson, printJsonLineInKey, dep);

    return `* ${dep}${
      lineNumber !== null ? ` (package.json:${lineNumber})` : ''
    }`;
  });
  return list.length ? [caption].concat(list) : [];
}

function mapMissing(missing, rootDir, oneline) {
  if (oneline) {
    return lodash.keys(missing);
  }
  return lodash.map(
    missing,
    (foundInFiles, key) =>
      `${key}: ${lodash.replace(lodash.first(foundInFiles), rootDir, '.')}`,
  );
}

function print(result, log, opt, rootDir) {
  if (opt.json) {
    log(
      JSON.stringify(result, (key, value) =>
        lodash.isError(value) ? value.stack : value,
      ),
    );
  } else if (noIssue(result)) {
    if (!opt.quiet) {
      log('No depcheck issue');
    }
  } else {
    const deps = prettify(
      'Unused dependencies',
      result.dependencies,
      opt.oneline,
      rootDir,
      'dependencies',
    );
    const devDeps = prettify(
      'Unused devDependencies',
      result.devDependencies,
      opt.oneline,
      rootDir,
      'devDependencies',
    );
    const missing = prettify(
      'Missing dependencies',
      mapMissing(result.missing, rootDir, opt.oneline),
      opt.oneline,
      rootDir,
    );
    const content = deps.concat(devDeps, missing).join('\n');
    log(content);
  }

  return result;
}

export default async function cli(args, log, error, exit) {
  try {
    const opt = await getConfiguration(args, name, version);
    const dir = opt._[0] || '.';
    const rootDir = path.resolve(dir);
    await checkPathExist(rootDir, `Path ${dir} does not exist`);
    await checkPathExist(
      path.resolve(rootDir, 'package.json'),
      `Path ${dir} does not contain a package.json file`,
    );
    const depcheckResult = await depcheck(rootDir, {
      ignoreBinPackage: opt.ignoreBinPackage,
      ignorePath: opt.ignorePath,
      ignoreMatches: opt.ignores || [],
      ignoreDirs: opt.ignoreDirs || [],
      ignorePatterns: opt.ignorePatterns || [],
      parsers: getParsers(opt.parsers),
      detectors: getDetectors(opt.detectors),
      specials: getSpecials(opt.specials),
      skipMissing: opt.skipMissing,
    });
    print(depcheckResult, log, opt, rootDir);
    exit(noIssue(depcheckResult) ? 0 : -1);
  } catch (err) {
    error(err);
    exit(-1);
  }
}
