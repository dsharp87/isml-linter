const specFileName = require('path').basename(__filename);
const SpecHelper   = require('../../SpecHelper');
const rule         = SpecHelper.getTreeRule(specFileName);

describe(rule.name, () => {
    beforeEach(() => {
        SpecHelper.beforeEach();
    });

    afterEach(() => {
        SpecHelper.afterEach();
    });

    it('detects simplest wrong indentation case', () => {
        const result = SpecHelper.parseAndApplyRuleToTemplate(rule, 0)[0];

        expect(result.line      ).toEqual('<br/>');
        expect(result.lineNumber).toEqual(2);
        expect(result.globalPos ).toEqual(6);
        expect(result.length    ).toEqual(3);
        expect(result.rule      ).toEqual(rule.name);
        expect(result.message   ).toEqual(rule.description);
    });

    it('detects wrong indentation with previous empty line', () => {
        const result = SpecHelper.parseAndApplyRuleToTemplate(rule, 1)[0];

        expect(result.line      ).toEqual('<br/>');
        expect(result.lineNumber).toEqual(3);
        expect(result.globalPos ).toEqual(7);
        expect(result.length    ).toEqual(3);
        expect(result.rule      ).toEqual(rule.name);
        expect(result.message   ).toEqual(rule.description);
    });

    it('ignores indentation for elements in the same line as their parents', () => {
        const result = SpecHelper.parseAndApplyRuleToTemplate(rule, 2);

        expect(result).toEqual([]);
    });

    it('detects wrong indentation with previous sibling element', () => {
        const result = SpecHelper.parseAndApplyRuleToTemplate(rule, 3)[0];

        expect(result.line      ).toEqual('<input type="text" />');
        expect(result.lineNumber).toEqual(3);
        expect(result.globalPos ).toEqual(87);
        expect(result.length    ).toEqual(5);
        expect(result.rule      ).toEqual(rule.name);
        expect(result.message   ).toEqual(rule.description);
    });

    it('checks indentation for elements at depth 0', () => {
        const result = SpecHelper.parseAndApplyRuleToTemplate(rule, 5);

        expect(result).toEqual([]);
    });
});