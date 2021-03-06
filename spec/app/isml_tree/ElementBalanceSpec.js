const SpecHelper  = require('../../SpecHelper');
const TreeBuilder = require('../../../src/isml_tree/TreeBuilder');
const Constants   = require('../../../src/Constants');

describe('TreeBuilder', () => {

    beforeEach(() => {
        SpecHelper.beforeEach();
    });

    afterEach(() => {
        SpecHelper.afterEach();
    });

    it('gets unbalanced element length', () => {
        const tree = getTreeFromTemplate(0);

        expect(tree.exception.length).toEqual(10);
    });

    it('gets unbalanced element global position', () => {
        const tree = getTreeFromTemplate(0);

        expect(tree.exception.globalPos).toEqual(1);
    });

    it('gets unbalanced element length II', () => {
        const tree = getTreeFromTemplate(1);

        expect(tree.exception.length).toEqual(8);
    });

    it('gets unbalanced element global position II', () => {
        const tree = getTreeFromTemplate(1);

        expect(tree.exception.globalPos).toEqual(241);
    });

    it('gets unbalanced element length III', () => {
        const tree = getTreeFromTemplate(2);

        expect(tree.exception.length).toEqual(36);
    });

    it('gets unbalanced element global position III: root-level element', () => {
        const tree = getTreeFromTemplate(2);

        expect(tree.exception.globalPos).toEqual(95);
    });
});

const getTemplatePath = number => {
    return `${Constants.specElementBalanceTemplatesDir}/template_${number}.isml`;
};

const getTreeFromTemplate = number => {
    const templatePath = getTemplatePath(number);
    return TreeBuilder.build(templatePath);
};
