const path                 = require('path');
const glob                 = require('glob');
const fs                   = require('fs');
const SpecHelper           = require('../SpecHelper');
const IsmlLinter           = require('../../src/app/IsmlLinter');
const Constants            = require('../../src/app/Constants');
const NoSpaceOnlyLinesRule = require('../../src/app/rules/line_by_line/no-space-only-lines');
const NoInlineStyleRule    = require('../../src/app/rules/line_by_line/no-inline-style');
const EnforceIsprintRule   = require('../../src/app/rules/line_by_line/enforce-isprint');
const ExceptionUtils       = require('../../src/app/util/ExceptionUtils');
const ConfigUtils          = require('../../src/app/util/ConfigUtils');

const specSpecificDirLinterTemplate  = Constants.specSpecificDirLinterTemplate;
const specIgnoreDirLinterTemplateDir = Constants.specIgnoreDirLinterTemplateDir;
const specFilenameTemplate           = Constants.specFilenameTemplate;
const UNPARSEABLE                    = ExceptionUtils.types.INVALID_TEMPLATE;
const unparseableFilePath            = path.join(specSpecificDirLinterTemplate, 'template_0.isml');
const file0Path                      = path.join(specSpecificDirLinterTemplate, 'template_1.isml');
const file1Path                      = path.join(specSpecificDirLinterTemplate, 'template_2.isml');

const targetObjName = SpecHelper.getTargetObjName(__filename);

describe(targetObjName, () => {
    beforeEach(() => {
        SpecHelper.beforeEach();
    });

    afterEach(() => {
        SpecHelper.afterEach();
    });

    it('lints ISML files in a given directory', () => {
        const result           = IsmlLinter.run(specSpecificDirLinterTemplate);
        const isprintError0    = result.errors[EnforceIsprintRule.description][file0Path][0];
        const isprintError1    = result.errors[EnforceIsprintRule.description][file1Path][0];
        const inlineStyleError = result.errors[NoInlineStyleRule.description][file0Path][0];
        const blankLineError   = result.errors[NoSpaceOnlyLinesRule.description][file0Path][0];

        expect(isprintError0.line       ).toEqual('<div style="display: none;">${addToCartUrl}</div>');
        expect(isprintError0.lineNumber ).toEqual(1);
        expect(isprintError0.globalPos  ).toEqual(28);
        expect(isprintError0.length     ).toEqual(15);
        expect(isprintError0.rule       ).toEqual(EnforceIsprintRule.name);
        expect(isprintError0.message    ).toEqual(EnforceIsprintRule.description);

        expect(isprintError1.line       ).toEqual(' ${URLUtils.https(\'Reorder-ListingPage\')}');
        expect(isprintError1.lineNumber ).toEqual(1);
        expect(isprintError1.globalPos  ).toEqual(1);
        expect(isprintError1.length     ).toEqual(40);
        expect(isprintError1.rule       ).toEqual(EnforceIsprintRule.name);
        expect(isprintError1.message    ).toEqual(EnforceIsprintRule.description);

        expect(inlineStyleError.line       ).toEqual('<div style="display: none;">${addToCartUrl}</div>');
        expect(inlineStyleError.lineNumber ).toEqual(1);
        expect(inlineStyleError.globalPos  ).toEqual(5);
        expect(inlineStyleError.length     ).toEqual(5);
        expect(inlineStyleError.rule       ).toEqual(NoInlineStyleRule.name);
        expect(inlineStyleError.message    ).toEqual(NoInlineStyleRule.description);

        expect(blankLineError.line       ).toEqual('   ');
        expect(blankLineError.lineNumber ).toEqual(2);
        expect(blankLineError.globalPos  ).toEqual(50);
        expect(blankLineError.length     ).toEqual(4);
        expect(blankLineError.rule       ).toEqual(NoSpaceOnlyLinesRule.name);
        expect(blankLineError.message    ).toEqual(NoSpaceOnlyLinesRule.description);

        expect(result[UNPARSEABLE][0].filePath   ).toEqual(unparseableFilePath);
        expect(result[UNPARSEABLE][0].message    ).toEqual('Unbalanced <div> element');
        expect(result[UNPARSEABLE][0].lineNumber ).toEqual(2);
        expect(result.issueQty                   ).toEqual(5);
    });

    it('lints ISML files in a given array of file paths', () => {
        const filePathArray    = glob.sync('spec/templates/default/isml_linter/specific_directory_to_be_linted/**/*.isml');
        const result           = IsmlLinter.run(filePathArray);
        const isprintError0    = result.errors[EnforceIsprintRule.description][file0Path][0];
        const isprintError1    = result.errors[EnforceIsprintRule.description][file1Path][0];
        const inlineStyleError = result.errors[NoInlineStyleRule.description][file0Path][0];
        const blankLineError   = result.errors[NoSpaceOnlyLinesRule.description][file0Path][0];

        expect(isprintError0.line       ).toEqual('<div style="display: none;">${addToCartUrl}</div>');
        expect(isprintError0.lineNumber ).toEqual(1);
        expect(isprintError0.globalPos  ).toEqual(28);
        expect(isprintError0.length     ).toEqual(15);
        expect(isprintError0.rule       ).toEqual(EnforceIsprintRule.name);
        expect(isprintError0.message    ).toEqual(EnforceIsprintRule.description);

        expect(isprintError1.line       ).toEqual(' ${URLUtils.https(\'Reorder-ListingPage\')}');
        expect(isprintError1.lineNumber ).toEqual(1);
        expect(isprintError1.globalPos  ).toEqual(1);
        expect(isprintError1.length     ).toEqual(40);
        expect(isprintError1.rule       ).toEqual(EnforceIsprintRule.name);
        expect(isprintError1.message    ).toEqual(EnforceIsprintRule.description);

        expect(inlineStyleError.line       ).toEqual('<div style="display: none;">${addToCartUrl}</div>');
        expect(inlineStyleError.lineNumber ).toEqual(1);
        expect(inlineStyleError.globalPos  ).toEqual(5);
        expect(inlineStyleError.length     ).toEqual(5);
        expect(inlineStyleError.rule       ).toEqual(NoInlineStyleRule.name);
        expect(inlineStyleError.message    ).toEqual(NoInlineStyleRule.description);

        expect(blankLineError.line       ).toEqual('   ');
        expect(blankLineError.lineNumber ).toEqual(2);
        expect(blankLineError.globalPos  ).toEqual(50);
        expect(blankLineError.length     ).toEqual(4);
        expect(blankLineError.rule       ).toEqual(NoSpaceOnlyLinesRule.name);
        expect(blankLineError.message    ).toEqual(NoSpaceOnlyLinesRule.description);

        expect(result[UNPARSEABLE][0].filePath   ).toEqual(unparseableFilePath);
        expect(result[UNPARSEABLE][0].message    ).toEqual('Unbalanced <div> element');
        expect(result[UNPARSEABLE][0].lineNumber ).toEqual(2);
        expect(result.issueQty                   ).toEqual(5);
    });

    it('ignores files under the node_modules/ directory', () => {
        const result       = IsmlLinter.run(specSpecificDirLinterTemplate);
        const stringResult = JSON.stringify(result);

        expect(stringResult.indexOf('node_modules')).toBe(-1);
    });

    it('processes the correct line in result json data', () => {
        const result = IsmlLinter.run(specSpecificDirLinterTemplate);

        expect(result.errors[EnforceIsprintRule.description][file0Path][0].line   ).toEqual('<div style="display: none;">${addToCartUrl}</div>');
        expect(result.errors[EnforceIsprintRule.description][file1Path][0].line   ).toEqual(' ${URLUtils.https(\'Reorder-ListingPage\')}');
        expect(result.errors[NoInlineStyleRule.description][file0Path][0].line    ).toEqual('<div style="display: none;">${addToCartUrl}</div>');
        expect(result.errors[NoSpaceOnlyLinesRule.description][file0Path][0].line ).toEqual('   ');
    });

    it('does not consider errors in directories defined to be ignored in the config file', () => {
        const lintResult = IsmlLinter.run(specIgnoreDirLinterTemplateDir);
        const result     = JSON.stringify(lintResult);

        expect(result.indexOf('this_directory_is_to_be_ignored')).toEqual(-1);
    });

    it('does not consider errors in files defined to be ignored in the config file', () => {
        const lintResult = IsmlLinter.run(specIgnoreDirLinterTemplateDir);
        const result     = JSON.stringify(lintResult);

        expect(result.indexOf('Email.isml')).toEqual(-1);
    });

    it('considers errors in files not defined to be ignored in the config file', () => {
        const lintResult = IsmlLinter.run(specIgnoreDirLinterTemplateDir);
        const result     = JSON.stringify(lintResult);

        expect(result.indexOf('this_directory_should_be_tested')).not.toEqual(-1);
    });

    it('parses files only under a given directory', () => {
        const lintResult = IsmlLinter.run(specIgnoreDirLinterTemplateDir);
        const result     = JSON.stringify(lintResult);

        expect(result.indexOf('this_directory_is_to_be_ignored')).toEqual(-1);
    });

    it('lists invalid templates as "unparseable"', () => {
        const result          = IsmlLinter.run(specSpecificDirLinterTemplate);
        const expectedMessage = ExceptionUtils.unbalancedElementError('div', 2).message;
        const actualResult    = result[UNPARSEABLE][0];
        const filePath        = path.join(specSpecificDirLinterTemplate, 'template_0.isml');

        expect(actualResult.filePath   ).toEqual(filePath);
        expect(actualResult.message    ).toEqual(expectedMessage);
        expect(actualResult.lineNumber ).toEqual(2);
    });

    it('accepts template absolute path as parameter', () => {
        const absoluteFilePath = path.join(Constants.clientAppDir, specSpecificDirLinterTemplate, 'template_0.isml');
        const result           = IsmlLinter.run(absoluteFilePath);
        const expectedMessage  = ExceptionUtils.unbalancedElementError('div', 2).message;
        const actualResult     = result[UNPARSEABLE][0];

        expect(actualResult.filePath   ).toEqual(absoluteFilePath);
        expect(actualResult.message    ).toEqual(expectedMessage);
        expect(actualResult.lineNumber ).toEqual(2);
    });

    it('applies fixes for tree-based rules', () => {
        ConfigUtils.load({
            autoFix: true,
            rules: {
                'one-element-per-line': {}
            }
        });

        const filePath        = path.join(Constants.clientAppDir, specSpecificDirLinterTemplate, 'template_1.isml');
        const originalContent = fs.readFileSync(filePath, 'utf-8');
        const result          = IsmlLinter.run(filePath);

        expect(result.templatesFixed).toEqual(1);
        fs.writeFileSync(filePath, originalContent);
    });

    it('lists inconsistent filenames', () => {
        ConfigUtils.load({ rules: { 'lowercase-filename': {} } });

        const rule    = require('../../src/app/rules/line_by_line/lowercase-filename');
        const dirPath = path.join(Constants.clientAppDir, specFilenameTemplate);
        const result  = IsmlLinter.run(dirPath);
        const error   = result.errors[0][path.join(dirPath, 'camelCaseTemplate.isml')];

        expect(error.line                           ).toEqual('');
        expect(error.lineNumber                     ).toEqual(0);
        expect(error.globalPos                      ).toEqual(0);
        expect(error.length                         ).toEqual(7);
        expect(error.rule                           ).toEqual(rule.name);
        expect(error.message                        ).toEqual(rule.description);
        expect(result[ExceptionUtils.UNKNOWN_ERROR] ).toBe(undefined);
    });
});