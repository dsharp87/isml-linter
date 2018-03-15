const reqlib = require('app-root-path').require;
const specFileName = require('path').basename(__filename);
const rule = reqlib('/src/spec/SpecHelper').getRule(specFileName);

describe(rule.name, () => {
    it('detects inadequate code', () => {
        const line = '\t';

        expect(rule.isBroken(line)).toBe(true);
    });

    it('accepts code that is not related to the rule', () => {
        const line = 'if (category == null && pdict.Product != null) {';

        expect(rule.isBroken(line)).toBe(false);
    });
});
