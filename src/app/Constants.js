const path    = require('path');
const appRoot = require('app-root-path');

// Environments;
const ENV_DEV  = 'dev';
const ENV_TEST = 'test';
const ENV_PROD = 'prod';

// Directory names;
const ismllinterDirName = 'isml-linter';
const outputDir         = 'output';

// File names;
const outputFileName         = 'output.json';
const compiledOutputFileName = 'compiled_output.json';
const clientConfigFileName   = '.ismllinter.json';
const specConfigFileName     = 'spec_config.json';

const clientAppDir        = appRoot.toString();
const linterMainDir       = clientAppDir;
const clientIsmlLinterDir = path.join(clientAppDir, ismllinterDirName);
const clientOutputDir     = path.join(clientIsmlLinterDir, outputDir);

// Directories;
const specDir                        = path.join(linterMainDir, 'src', 'spec');
const specTempDir                    = path.join(specDir, 'temp');
const specTemplateDir                = path.join(specDir, 'templates', 'default');
const specFileParserTemplate         = path.join(specTemplateDir, 'file_parser');
const specLinterTemplate             = path.join(specTemplateDir, 'isml_linter');
const specSpecificDirLinterTemplate  = path.join(specLinterTemplate, 'specific_directory_to_be_linted');
const specIgnoreDirLinterTemplateDir = path.join(specLinterTemplate, 'ignore_config');
const specRuleTemplateDir            = path.join(specTemplateDir, 'rules');
const specIsmlTreeTemplateDir        = path.join(specTemplateDir, 'isml_tree');
const specLineNumberTemplateDir      = path.join(specIsmlTreeTemplateDir, 'line_numbers');
const specInvalidTemplateDir         = path.join(specIsmlTreeTemplateDir, 'invalid_templates');
const specComplexTemplatesDir        = path.join(specIsmlTreeTemplateDir, 'complex_templates');
const specIsifTagParserTemplateDir   = path.join(specTemplateDir, 'isml_tree', 'components', 'isif_tag_parser');
const rulesDir                       = path.join(linterMainDir, 'src', 'app', 'rules');
const lineByLineRulesDir             = path.join(linterMainDir, 'src', 'app', 'rules', 'line_by_line');
const treeRulesDir                   = path.join(rulesDir, 'tree');

// Regex;
const srcJsRegex  = path.join('src', '**', '*.js');
const appJsRegex  = path.join('src', 'app', '**', '*.js');
const specJsRegex = path.join('src', 'spec', '**', '*.js');

// File paths;
const specOutputFilePath         = path.join(specTempDir, outputFileName);
const specCompiledOutputFilePath = path.join(specTempDir, compiledOutputFileName);
const configFilePath             = path.join(clientAppDir, clientConfigFileName);

// Links;
const repositoryUrl = 'https://github.com/FabiowQuixada/isml-linter';

// Others;
const UNPARSEABLE = 'nonparseable';

module.exports = {
    // Client directories;
    clientAppDir,
    clientIsmlLinterDir,
    clientOutputDir,

    // Directories;
    ismlLinterSpecDir: specLinterTemplate,
    specSpecificDirLinterTemplate,
    specIgnoreDirLinterTemplateDir,
    fileParserSpecDir: specFileParserTemplate,
    specTempDir,
    outputDir,
    rulesDir,
    lineByLineRulesDir,
    treeRulesDir,
    specRuleTemplateDir,
    specIsmlTreeTemplateDir,
    specIsifTagParserTemplateDir,
    ismllinterDirName,
    specLineNumberTemplateDir,
    specInvalidTemplateDir,
    specComplexTemplatesDir,
    specDir,

    // File names;
    outputFileName,
    compiledOutputFileName,
    clientConfigFileName,
    specConfigFileName,

    // File paths;
    specOutputFilePath,
    specCompiledOutputFilePath,
    configFilePath,

    // Regex;
    srcJsRegex,
    appJsRegex,
    specJsRegex,

    // Environments;
    ENV_DEV,
    ENV_TEST,
    ENV_PROD,

    // Links
    repositoryUrl,

    // Others;
    UNPARSEABLE,
};
