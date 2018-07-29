const AbstractSingleLineRule = require('../AbstractSingleLineRule');

const ruleName = require('path').basename(__filename).slice(0, -3);
const description = 'Avoid using <br/> tags, use css instead';

const Rule = Object.create(AbstractSingleLineRule);

Rule.build(ruleName, description);

Rule.isBroken = function(line) { return line.indexOf('<br') !== -1; };

module.exports = Rule;
