const IsmlNode        = require('./IsmlNode');
const IsifTagParser   = require('./components/IsifTagParser');
const StateUtils      = require('./components/StateUtils');
const ParseUtils      = require('./components/ParseUtils');
const MultiClauseNode = require('./MultiClauseNode');
const ExceptionUtils  = require('../util/ExceptionUtils');
const MaskUtils       = require('./MaskUtils');
const fs              = require('fs');

const postProcess = (node, data = {}) => {
    node.getChildren().forEach( child => {
        if (child.getValue().indexOf('template="util/modules"') !== -1) {
            data.moduleDefinition = {
                value      : child.getValue(),
                lineNumber : child.getLineNumber(),
                globalPos  : child.getGlobalPos(),
                length     : child.getValue().trim().length
            };
        }

        if (child.isCustomIsmlTag()) {
            data.customModuleArray = data.customModuleArray || [];
            data.customModuleArray.push({
                value      : child.getValue(),
                lineNumber : child.getLineNumber(),
                globalPos  : child.getGlobalPos(),
                length     : child.getValue().trim().length
            });
        }

        return postProcess(child, data);
    });

    return data;
};

const build = (filePath, content) => {

    const ParseStatus = require('../enums/ParseStatus');

    const result = {
        filePath,
        status : ParseStatus.NO_ERRORS
    };

    try {
        const fileContent = content || fs.readFileSync(filePath, 'utf-8');
        result.rootNode   = parse(fileContent, undefined, undefined, filePath);
        result.data       = postProcess(result.rootNode);

    } catch (e) {
        result.rootNode  = null;
        result.status    = ParseStatus.INVALID_DOM;
        result.exception = e === ExceptionUtils.types.UNKNOWN_ERROR ?
            ExceptionUtils.getParseErrorMessage(filePath) :
            e;
    }

    return result;
};

const parse = (content, parentState, parentNode = new IsmlNode(), filePath) => {

    let state = StateUtils.getInitialState(content, parentState, parentNode, filePath);

    for (let i = 0; i < content.length; i++) {
        state = initializeLoopState(state, i);
        state = iterate(state);
    }

    parseRemainingContent(state);

    return state.parentNode;
};

const iterate = state => {

    if (ParseUtils.isSkipIteraction(state)) {
        return state;
    }

    state = parseState(state);

    return state;
};

const initializeLoopState = (oldState, i) => {
    let state = Object.assign({}, oldState);
    state     = updateStateWhetherItIsInsideExpression(state);

    state.currentPos              = i;
    state.currentChar             = state.content.charAt(state.currentPos);
    state.currentElement.asString += state.currentChar;

    if (ParseUtils.isWhite(state)) {
        state.currentElement.startingLineNumber = state.currentLineNumber;
    }

    if (ParseUtils.isStopIgnoring(state)) {
        state.ignoreUntil = null;

        // TODO: There is probably a better way to handle deprecated ISML comments;
        if (state.currentElement.asString.trim().startsWith('<!---')) {
            state.currentElement.asString = state.currentChar;
        }
    }

    return state;
};

const parseState = oldState => {

    let state = Object.assign({}, oldState);

    const currentElement   = state.currentElement.asString.trim();
    const isHtmlComment    = currentElement.startsWith('<!--') && currentElement.endsWith('-->');
    const isOpeningTagChar = state.currentChar === '<';
    const isClosingTagChar = state.currentChar === '>' && !currentElement.startsWith('<!--') || isHtmlComment;

    if (isOpeningTagChar) {
        state = prepareStateForOpeningElement(state);
    } else if (isClosingTagChar) {
        state = createNodeForCurrentElement(state);
    } else if (ParseUtils.isWhite(state)) {
        state.nonTagBuffer += state.currentChar;
    }

    return state;
};

const updateStateWhetherItIsInsideExpression = oldState => {
    const state = Object.assign({}, oldState);

    if (!ParseUtils.isWhite(state)) {
        if (ParseUtils.isOpeningIsmlExpression(state)) {
            state.insideExpression = true;
            state.ignoreUntil      = state.currentPos + state.content.substring(state.currentPos).indexOf('}');
        } else if (ParseUtils.isClosingIsmlExpression(state)) {
            state.insideExpression = false;
        }
    }

    return state;
};

const createNode = oldState => {
    let state       = Object.assign({}, oldState);
    state           = updateStateLinesData(state);
    const globalPos = ParseUtils.getGlobalPos(state);

    const isIsifNode = ParseUtils.isCurrentElementIsifTag(state);
    const node       = isIsifNode ?
        new MultiClauseNode() :
        new IsmlNode(state.currentElement.asString, state.currentElement.startingLineNumber, globalPos);

    state.parentNode.addChild(node);

    if (node.isSelfClosing()) {
        return null;
    }

    const innerParseResult    = parseNewNodeInnerContent(state);
    const innerContentLastPos = innerParseResult.innerContentLastPosition;
    const suffixableNode      = isIsifNode ? node.getLastChild() : node;

    const suffixValue      = state.closingElementsStack.pop().trim();
    const suffixLineNumber = innerParseResult.suffixLineNumber;
    const suffixGlobalPos  = innerParseResult.suffixGlobalPos;

    suffixableNode.setSuffix(suffixValue, suffixLineNumber, suffixGlobalPos);

    return innerContentLastPos;
};

const parseNewNodeInnerContent = state => {

    const parentNode       = state.parentNode.newestChildNode;
    const nodeInnerContent = ParseUtils.getInnerContent(state);
    let remainingContent   = nodeInnerContent;

    if (!ParseUtils.isNextElementATag(nodeInnerContent)) {
        remainingContent = parseTextNode(state, nodeInnerContent);
    }

    if (remainingContent) {
        if (ParseUtils.isCurrentElementIsifTag(state)) {
            IsifTagParser.run(remainingContent, state);
        } else {
            parse(remainingContent, state, parentNode);
        }
    }

    const stateStartingPos          = state.parentState ? getCurrentStateStartingPos(state.parentState) : 0;
    const index                     = state.content.lastIndexOf('<');
    const currentStateContentLength = state.content.substring(0, index).length;
    const suffixGlobalPos           = stateStartingPos + currentStateContentLength;
    const currentLineNumber         = getSuffixLineNumber(state);

    return {
        innerContentLastPosition : state.currentPos + nodeInnerContent.length,
        suffixLineNumber         : currentLineNumber,
        suffixGlobalPos          : suffixGlobalPos
    };
};

const getSuffixLineNumber = state => {
    const closingTagStackCopy   = [...state.closingElementsStack];
    const elem                  = closingTagStackCopy.pop();
    const trimmedElem           = elem.trim();
    const suffixElemIndex       = elem.indexOf(trimmedElem);
    const lineBreaksInSuffix    = closingTagStackCopy.length > 0 ? ParseUtils.getLineBreakQty(elem.substring(0, suffixElemIndex)) : 0;
    const suffixGlobalIndex     = state.content.indexOf(elem);
    const contentUpToCurrentPos = state.content.substring(state.currentPos, suffixGlobalIndex);
    const contentLength         = ParseUtils.getLineBreakQty(contentUpToCurrentPos);
    const suffixLineNumber      = state.currentLineNumber + contentLength + lineBreaksInSuffix;

    return suffixLineNumber;
};

const getCurrentStateStartingPos = state => {
    let accumulatedValue = 0;
    let iterator         = state;

    do {
        accumulatedValue += iterator.currentElement.asString.length;
        iterator         = iterator.parentState;
    } while (iterator);

    return accumulatedValue;
};

const createTextNodeFromMainLoop = oldState => {
    const state = Object.assign({}, oldState);

    if (state.nonTagBuffer && state.nonTagBuffer.replace(/\s/g, '').length) {
        const lineBreakQty = ParseUtils.getPrecedingEmptyLinesQty(state.nonTagBuffer);
        const globalPos    = ParseUtils.getNextNonEmptyCharPos(state.nonTagBuffer);
        const lineNumber   = state.currentLineNumber + lineBreakQty;
        const node         = new IsmlNode(state.nonTagBuffer, lineNumber, globalPos);

        state.currentLineNumber                 += ParseUtils.getLineBreakQty(state.nonTagBuffer);
        state.parentNode.addChild(node);
        StateUtils.initializeCurrentElement(state);
        state.currentElement.startingLineNumber = state.currentLineNumber;
        state.currentElement.asString           = '<';
        state.ignoreUntil                       += state.nonTagBuffer.length - 1;
    }

    return state;
};

const createTextNodeFromInnerContent = (text, state, parentNode) => {
    if (text) {
        const lineBreakQty  = ParseUtils.getPrecedingEmptyLinesQty(text);
        const globalPos     = ParseUtils.getTextGlobalPos(state, text);
        const innerTextNode = new IsmlNode(text, state.currentLineNumber + lineBreakQty, globalPos);

        state.currentLineNumber += ParseUtils.getLineBreakQty(text);

        parentNode.addChild(innerTextNode);
    }
};

const createNodeForCurrentElement = oldState => {

    const state = Object.assign({}, oldState);

    ParseUtils.lighten(state);

    if (ParseUtils.isWhite(state)) {
        const lineBreakQty = ParseUtils.getLineBreakQty(state.currentElement.asString);

        state.currentLineNumber += lineBreakQty;

        if (ParseUtils.isOpeningElem(state)) {
            state.ignoreUntil = createNode(state);
        }

        StateUtils.initializeCurrentElement(state);
    }

    return state;
};

const prepareStateForOpeningElement = oldState => {
    let state = Object.assign({}, oldState);

    state = createTextNodeFromMainLoop(state);

    if (ParseUtils.isWhite(state)) {
        state.currentElement.initPosition = state.currentPos;
    }

    ParseUtils.darken(state);

    return state;
};

const updateStateLinesData = oldState => {
    const state                             = Object.assign({}, oldState);
    const emptyLinesQty                     = ParseUtils.getPrecedingEmptyLinesQty(state.currentElement.asString);
    state.currentElement.startingLineNumber += emptyLinesQty;

    if (state.parentState && !state.node.isMulticlause()) {
        state.parentState.currentElement.startingLineNumber += emptyLinesQty;
    }

    return state;
};

const parseRemainingContent = state => {
    const trailingTextValue = state.nonTagBuffer;

    if (trailingTextValue) {
        if (trailingTextValue.trim()) {
            const lineBreakQty = ParseUtils.getPrecedingEmptyLinesQty(trailingTextValue);
            const globalPos    = ParseUtils. getNextNonEmptyCharPos(trailingTextValue);
            const node         = new IsmlNode(trailingTextValue, state.currentLineNumber + lineBreakQty, globalPos);

            state.parentNode.addChild(node);
        } else {
            let lastNode = state.parentNode.getLastChild() || state.parentNode;

            if (lastNode.isMulticlause()) {
                lastNode = lastNode.getLastChild();
            }

            lastNode.getSuffixValue() ?
                lastNode.suffixValue += trailingTextValue :
                lastNode.value       += trailingTextValue ;
        }
    }
};

const parseTextNode = (state, nodeInnerContent) => {
    const parentNode    = state.parentNode.newestChildNode;
    let content         = nodeInnerContent;
    let textNodeParent  = state.parentNode.newestChildNode;
    const textNodeValue = getTextNodeValue(nodeInnerContent, content, parentNode);

    if (parentNode.isMulticlause()) {
        const node     = new IsmlNode(state.currentElement.asString, state.currentElement.startingLineNumber);
        textNodeParent = node;
        parentNode.addChild(node);
    }

    createTextNodeFromInnerContent(textNodeValue, state, textNodeParent);
    content = content.substring(textNodeValue.length);

    return content;
};

const getTextNodeValue = (nodeInnerContent, content, parentNode) => {
    let textNodeValue = nodeInnerContent;

    const maskedText  = MaskUtils.maskIgnorableContent(textNodeValue);

    if (ParseUtils.isNextElementAnIsmlExpression(content)) {
        textNodeValue = content.substring(0, maskedText.indexOf('<')) || textNodeValue;
    }
    else if (!parentNode.isOfType(['iscomment', 'isscript'])) {
        textNodeValue = maskedText.substring(0, maskedText.indexOf('<')) || textNodeValue;
    }

    return textNodeValue;
};

module.exports.build = build;
module.exports.parse = parse;
