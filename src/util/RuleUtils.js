const path                  = require('path');
const fs                    = require('fs');
const Constants             = require('../Constants');
const TreeBuilder           = require('../isml_tree/TreeBuilder');
const ConfigUtils           = require('./ConfigUtils');
const lowercaseFilenameRule = require('../rules/line_by_line/lowercase-filename');
const customTagContainer    = require('./CustomTagUtils');
const CustomModulesRule     = require('../rules/tree/custom-tags');
const GeneralUtils          = require('./GeneralUtils');

const lineByLineRules = [];
const treeRules       = [];

(() => {
    const lineRuleFileArray = fs.readdirSync(Constants.lineByLineRulesDir);
    const treeRuleFileArray = fs.readdirSync(Constants.treeRulesDir);

    for (let i = 0; i < lineRuleFileArray.length; i++) {
        const file = lineRuleFileArray[i];

        if (file.endsWith('.js')) {
            const rulePath = path.join(__dirname, '..', 'rules', 'line_by_line', file);
            lineByLineRules.push(require(rulePath));
        }
    }

    for (let i = 0; i < treeRuleFileArray.length; i++) {
        const file = treeRuleFileArray[i];

        if (file.endsWith('.js')) {
            const rulePath = path.join(__dirname, '..', 'rules', 'tree', file);
            treeRules.push(require(rulePath));
        }
    }
})();

const checkCustomTag = tag => {
    if (Object.prototype.hasOwnProperty.call(customTagContainer, tag)) {
        const attrList = customTagContainer[tag].attrList;

        for (let i = 0; i < attrList.length; i++) {
            const attr = attrList[i];
            if (attr !== attr.toLowerCase()) {
                return {
                    line       : '',
                    globalPos  : 0,
                    length     : 10,
                    lineNumber : 1,
                    rule       : CustomModulesRule.id,
                    message    : `Module properties need to be lower case: "${tag}" module has the invalid "${attr}" attribute`
                };
            }
        }
    }
};

const applyRuleResult = (config, ruleResult, templatePath, templateResults, rule) => {
    if (config.autoFix && ruleResult.fixedContent) {
        fs.writeFileSync(templatePath, ruleResult.fixedContent);
        templateResults.fixed = true;
    }
    else if (ruleResult.occurrences && ruleResult.occurrences.length) {
        const errorObj         = getErrorObj(rule, ruleResult.occurrences);
        templateResults.errors = Object.assign(templateResults.errors, errorObj.errors);
    }
};

const applyRuleOnTemplate = (ruleArray, templatePath, root, config) => {
    const templateResults = {
        fixed  : false,
        errors : {}
    };

    for (let i = 0; i < ruleArray.length; i++) {
        const rule = ruleArray[i];
        if (!rule.isIgnore(templatePath)) {
            const ruleResults = rule.check(root, { occurrences: [] }, templateResults.data);
            applyRuleResult(config, ruleResults, templatePath, templateResults, rule);
        }
    }

    return templateResults;
};

const findNodeOfType = (node, type) => {
    let result = null;

    node.children.some( child => {
        if (child.isOfType(type)) {
            result = child;
            return true;
        } else {
            result = findNodeOfType(child, type) || result;
        }

        return false;
    });

    return result;
};

const isTypeAmongTheFirstElements = (rootNode, type) => {
    let result = false;

    for (let i = 0; i < Constants.leadingElementsChecking; i++) {
        result = result ||
            rootNode.children[i] &&
            rootNode.children[i].isOfType(type);
    }

    return result;
};

const getErrorObj = (rule, occurrenceArray) => {
    const errorObj                = {};
    errorObj[rule.level]          = {};
    errorObj[rule.level][rule.id] = [];

    for (let i = 0; i < occurrenceArray.length; i++) {
        const occurrence = occurrenceArray[i];
        errorObj[rule.level][rule.id].push(occurrence);
    }

    return errorObj;
};

const checkFileName = (filename, templateContent) => {
    const templateResults = {
        fixed  : false,
        errors : {}
    };

    if (lowercaseFilenameRule.isEnabled()) {
        const ruleResult = lowercaseFilenameRule.check(filename, templateContent);

        if (ruleResult) {
            const errorObj         = getErrorObj(lowercaseFilenameRule, ruleResult.occurrences);
            templateResults.errors = Object.assign(templateResults.errors, errorObj.errors);
        }
    }

    return templateResults;
};

const checkTreeRules = (templatePath, templateContent, config) => {
    if (!config.disableTreeParse) {
        const tree = TreeBuilder.build(templatePath, templateContent);

        if (!tree.rootNode) {
            throw tree.exception;
        }

        const ruleArray = getEnabledTreeRules();

        return applyRuleOnTemplate(
            ruleArray,
            templatePath,
            tree.rootNode,
            config);
    }
};

const checkLineByLineRules = (templatePath, templateContent, config) => {
    const ruleArray = getEnabledLineRules();

    return applyRuleOnTemplate(
        ruleArray,
        templatePath,
        templateContent,
        config);
};

const checkCustomModules = () => {
    const moduleResults = {
        errors : []
    };

    if (CustomModulesRule.isEnabled()) {
        for (const tag in customTagContainer) {
            const errorObj = checkCustomTag(tag);

            if (errorObj) {
                moduleResults.errors.push(errorObj);
            }
        }
    }

    return moduleResults;
};

const checkTemplate = (templatePath, content, templateName) => {
    const config          = ConfigUtils.load();
    const templateContent = GeneralUtils.toLF(content || fs.readFileSync(templatePath, 'utf-8'));
    const lineResults     = checkLineByLineRules(templatePath, templateContent, config);
    const treeResults     = checkTreeRules(templatePath, templateContent, config) || { errors : [] };
    const filenameResults = checkFileName(templateName, templateContent);

    return {
        fixed    : lineResults.fixed || treeResults.fixed,
        treeData : treeResults.data,
        errors   : {
            ...lineResults.errors,
            ...treeResults.errors,
            ...filenameResults.errors
        }
    };
};

const getAvailableRulesQty = () => treeRules.length + lineByLineRules.length;

const getEnabledLineRules  = () => {
    const result = [];

    for (let i = 0; i < lineByLineRules.length; i++) {
        const rule = lineByLineRules[i];

        if (rule.isEnabled() && rule.id !== 'lowercase-filename') {
            result.push(rule);
        }
    }

    return result;
};

const getEnabledTreeRules = () => {
    const result = [];

    for (let i = 0; i < treeRules.length; i++) {
        const rule = treeRules[i];

        if (rule.isEnabled()) {
            result.push(rule);
        }
    }

    return result;
};

module.exports.getAllLineRules             = () => lineByLineRules;
module.exports.findNodeOfType              = findNodeOfType;
module.exports.isTypeAmongTheFirstElements = isTypeAmongTheFirstElements;
module.exports.checkTemplate               = checkTemplate;
module.exports.checkCustomModules          = checkCustomModules;
module.exports.getAvailableRulesQty        = getAvailableRulesQty;
