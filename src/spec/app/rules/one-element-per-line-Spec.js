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

    it('detects elements in the same line', () => {
        const result = SpecHelper.parseAndApplyRuleToTemplate(rule, 0);

        expect(result).toEqual([{
            line        : '${Resource.msg(\'field.billing.address.last.name\',\'address\',null)}',
            lineNumber  : 7,
            columnStart : 360,
            length      : 65,
            rule        : rule.name,
            message     : rule.description
        }]);
    });

    it('allows one element per line', () => {
        const result = SpecHelper.parseAndApplyRuleToTemplate(rule, 1);

        expect(result).toEqual([]);
    });
});
