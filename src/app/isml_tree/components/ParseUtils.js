
/**
 * The functions defined in this file do not create or modify a state, they
 * simply analyze it and return relevant information;
 */

const MaskUtils        = require('../MaskUtils');
const ClosingTagFinder = require('./ClosingTagFinder');
const Constants        = require('../../Constants');

const ISIF = '<isif';

const pickInnerContent  = (state, content) => {
    const innerContentStartPos = state.currentElement.endPosition + 1;
    const innerContentEndPos   = state.currentElemClosingTagInitPos;
    return content.substring(innerContentStartPos, innerContentEndPos);
};

const getUpdateContent = state => {
    let content                      = state.content;
    const currentElementInitPosition = state.currentElement.initPosition;
    content                          = content.substring(currentElementInitPosition, content.length);
    return content;
};

const getAccumulatedPos = state => {
    let accumulatedValue = 0;
    let iterator         = state;

    do {
        accumulatedValue += iterator.currentPos + 1;
        iterator         = iterator.parentState;
    } while (iterator);

    return accumulatedValue;
};

const getNextNonEmptyChar = content => {
    return content.replace(new RegExp(Constants.EOL, 'g'), '').trim()[0];
};

module.exports.getLineBreakQty = string => (string.match(new RegExp(Constants.EOL, 'g')) || []).length;

const getNextNonEmptyCharPos = content => {
    const firstNonEmptyChar = getNextNonEmptyChar(content);
    return content.indexOf(firstNonEmptyChar);
};

module.exports.getNextNonEmptyCharPos = getNextNonEmptyCharPos;

module.exports.getPostClosingTagContentUpToLneBreak = (content, startPos) => {
    let postContent = '';

    for (let i = startPos + 1; i < content.length; i++) {
        const currentChar = content.charAt(i);

        if (currentChar !== Constants.EOL && currentChar !== '\t') {
            break;
        }

        postContent += currentChar;
    }

    return postContent;
};

module.exports.isOpeningElem = state => {

    const content     = state.content;
    const currPos     = state.currentElement.initPosition;
    const currentChar = content.charAt(currPos);
    const nextChar    = content.charAt(currPos + 1);

    return currentChar === '<' && nextChar !== '/';
};

module.exports.isStackable = elem => {
    return !elem.startsWith('!--') &&
            elem !== 'iselse' &&
            elem !== 'iselseif';
};

module.exports.getNextElementValue = content => {
    const maskedContent = MaskUtils.maskInBetween(content, '<!---', '--->', true);
    const index         = maskedContent.indexOf('>');

    return content.substring(0, index + 1);
};

module.exports.isNextElementATag = content => {
    return getNextNonEmptyChar(content) === '<';
};

module.exports.isNextElementAnIsmlExpression = content => {
    return content.trim().startsWith('${');
};

module.exports.isNextElementIsifTag = content => {
    return content.trim().startsWith(ISIF);
};

module.exports.isNextElementHtmlComment = content => {
    return content.trim().startsWith('<!--');
};

module.exports.isCurrentElementIsifTag = state => {
    return state.currentElement.asString.trim().startsWith(ISIF);
};

module.exports.isOpeningIsmlExpression = state => {

    const content    = state.content;
    const currentPos = state.currentPos;
    const currChar   = content.charAt(currentPos);
    const nextChar   = content.charAt(currentPos + 1);

    return currChar === '$' && nextChar === '{';
};

module.exports.isClosingIsmlExpression = state => {

    const content          = state.content;
    const currentPos       = state.currentPos;
    const insideExpression = state.insideExpression;

    return insideExpression && content.charAt(currentPos - 1) === '}';
};

module.exports.getInnerContent = oldState => {
    let state     = Object.assign({}, oldState);
    const content = getUpdateContent(state);
    state         = ClosingTagFinder.getCorrespondentClosingElementPosition(content, state);

    return pickInnerContent(state, content);
};

module.exports.getPrecedingEmptyLinesQty = content => {

    const lineArray  = content.split(Constants.EOL);
    let lineBreakQty = 0;

    lineArray.some( line => {
        if (!line.trim()) {
            lineBreakQty++;
            return false;
        }
        return true;
    });

    return lineBreakQty;
};

module.exports.isSkipIteraction = state => {
    return state.ignoreUntil && state.ignoreUntil >= state.currentPos ||
            state.insideTag && state.insideExpression;
};

module.exports.isCorrespondentElement = (state, elem) => {
    return `/${state.elementStack[state.elementStack.length - 1].elem}` === elem;

};

module.exports.getFirstElementType = elementAsString => {
    const elementEndPos = elementAsString.indexOf('>') === -1 ? elementAsString.length : elementAsString.indexOf('>');
    let result          = elementAsString.substring(elementAsString.indexOf('<') + 1, elementEndPos);

    // In case the tag has attributes;
    if (result.indexOf(' ') !== -1) {
        result = result.split(' ')[0];
    }

    return result;
};

module.exports.getCurrentElementEndPosition = content => {

    content                      = MaskUtils.maskIgnorableContent(content);
    const currentElemEndPosition = content.indexOf('<');

    return {
        currentElemEndPosition,
        content
    };
};

module.exports.getClauseContent = content => {
    const maskedContent = MaskUtils.maskIgnorableContent(content);
    return content.substring(0, maskedContent.indexOf('>') + 1);
};

module.exports.getClauseInnerContent = content => {
    const maskedContent = MaskUtils.maskIgnorableContent(content);
    return content.substring(maskedContent.indexOf('>') + 1, maskedContent.length);
};

module.exports.getAllConditionalTags = content => {

    const tagList       = [];
    const maskedContent = MaskUtils.maskIgnorableContent(content);

    for (let i = 0; i < maskedContent.length; i++) {
        if (content.charAt(i - 1) === '<') {
            let end = Math.min(maskedContent.substring(i).indexOf(' '), maskedContent.substring(i).indexOf('>'));
            if (end === -1) {
                end = Math.max(maskedContent.substring(i).indexOf(' '), maskedContent.substring(i).indexOf('>'));
            }
            const tag = content.substring(i, i + end);
            if (['isif', 'iselse', 'iselse/', 'iselseif', '/isif'].indexOf(tag) !== -1) {
                tagList.push({
                    tag,
                    startPos : i - 1
                });
            }
        }
    }

    return tagList;
};

module.exports.getOuterConditionalTagList = tagList => {

    let depth = 0;

    tagList = tagList.filter(tagObj => {
        if (tagObj.tag.startsWith('isif')) {
            depth += 1;
        }

        if (depth === 0) {
            return true;
        }

        if (tagObj.tag === '/isif') {
            depth -= 1;
        }

        return false;
    });

    return tagList;
};

module.exports.isStopIgnoring = state => {
    return state.ignoreUntil &&
        state.ignoreUntil < state.currentPos &&
        state.ignoreUntil !== state.content.length + 1;
};

module.exports.getClauseList = content => {

    const clauseStringList = [];

    let tagList = this.getAllConditionalTags(content);
    tagList     = this.getOuterConditionalTagList(tagList);

    let lastIndex = 0;
    tagList.forEach( tagObj => {
        clauseStringList.push(content.substring(lastIndex, tagObj.startPos));
        lastIndex = tagObj.startPos;
    });

    clauseStringList.push(content.substring(lastIndex, content.length));

    return clauseStringList;
};

const DEPTH_COLOR = {
    WHITE : 0,
    GRAY  : 1,
    BLACK : 2
};

module.exports.DEPTH_COLOR = DEPTH_COLOR;

module.exports.isWhite = state => state.depthColor === DEPTH_COLOR.WHITE;
module.exports.isGray  = state => state.depthColor === DEPTH_COLOR.GRAY;
module.exports.isBlack = state => state.depthColor === DEPTH_COLOR.BLACK;

module.exports.darken  = state => state.depthColor++;
module.exports.lighten = state => state.depthColor--;

module.exports.getGlobalPos = state => {
    const currentElement = state.currentElement.asString;
    const accumulatedPos = getAccumulatedPos(state);

    const newLocal = accumulatedPos - currentElement.trim().length;
    return newLocal;
};

module.exports.getTextGlobalPos = (state, text) => {
    const precedingEmptySpacesQty = getNextNonEmptyCharPos(text);
    const accumulatedPos          = getAccumulatedPos(state);

    return accumulatedPos + precedingEmptySpacesQty;

};
