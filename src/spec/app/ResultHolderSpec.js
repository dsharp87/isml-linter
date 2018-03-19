const appRoot = require('app-root-path');
const reqlib = appRoot.require;
const ResultHolder = reqlib('/src/app/ResultHolder');
const LogicInTemplateRule = reqlib('/src/app/rules/LogicInTemplateRule');
const SpecHelper = reqlib('/src/spec/SpecHelper');
const Constants = reqlib('/src/app/Constants');

const specTempDir = Constants.specTempDir;
const outputFilePath = Constants.specOutputFilePath;

describe('ResultHolder', () => {

    const rule = LogicInTemplateRule.title;
    const fileName = 'reorder/quickreorder.isml';
    const line = '<isscript>';
    const lineNumber = 3;

    beforeEach(() => {
        ResultHolder.cleanOutput();
        SpecHelper.cleanTempDirectory();
    });

    afterEach(() => {
        SpecHelper.cleanTempDirectory();
    });

    it('adds an error to the output', () => {
        const expectedResult = expectedResultObj('errors');

        ResultHolder.addError(rule, fileName, line, lineNumber);

        expect(ResultHolder.getOutput()).toEqual(expectedResult);
    });

    it('adds a warning to the output', () => {
        const expectedResult = expectedResultObj('warnings');

        ResultHolder.addWarning(rule, fileName, line, lineNumber);

        expect(ResultHolder.getOutput()).toEqual(expectedResult);
    });

    it('adds a info to the output', () => {
        const expectedResult = expectedResultObj('info');

        ResultHolder.addInfo(rule, fileName, line, lineNumber);

        expect(ResultHolder.getOutput()).toEqual(expectedResult);
    });

    it('cleans output', () => {
        ResultHolder.cleanOutput();

        expect(ResultHolder.getOutput()).toEqual({});
    });

    it('saves output to file', () => {
        ResultHolder.addError(rule, fileName, line, lineNumber);
        ResultHolder.saveToFile(specTempDir);

        const outputFile = reqlib('/' + outputFilePath);
        const expectedResult = expectedResultObj('errors');

        expect(outputFile).toEqual(expectedResult);
    });

    it('saves linter report to file', () => {
        ResultHolder.addError(rule, fileName, line, lineNumber);
        ResultHolder.exportReport(specTempDir);

        const outputFile = reqlib(reportFilePath);
        const expectedResult = expectedReportObj();

        expect(outputFile).toEqual(expectedResult);
    });

    const expectedResultObj = type => {
        let result = {};

        result[type] = {
            'Avoid putting logic into ISML' : {
                'reorder/quickreorder.isml' : [
                    'Line 4: <isscript>' ] }};

        return result;
    };

    const expectedReportObj = () => {
        return {
            'errors' : {
                'Avoid putting logic into ISML' : 1
            }
        };
    };
});
