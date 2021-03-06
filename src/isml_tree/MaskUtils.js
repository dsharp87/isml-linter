/**
 * Replaces '${...}' with '${___}', so it facilitates next processes. For Example,
 * if ${ 3 < 4 } is present, the '<' symbol might be thought as an opening tag
 * symbol. The same is valid for <isscript> and <iscomment> tags;
 */

const placeholderSymbol = '_';

const maskIgnorableContent = (content, isMaskBorders) => {

    content = maskInBetween(content, 'iscomment', isMaskBorders);
    content = maskInBetween(content, '${', '}', isMaskBorders);
    content = maskInBetween(content, 'isscript', isMaskBorders);
    content = maskInBetweenForTagWithAttributes(content, 'script');
    content = maskInBetweenForTagWithAttributes(content, 'style');
    content = maskInBetween(content, '<!---', '--->', isMaskBorders);
    content = maskInBetween(content, '<!--', '-->', isMaskBorders);
    content = maskNestedIsmlElements(content);

    return content;
};

/**
 * Masks nested isml elements so that they don't interfere with the Isml Dom tree building;
 *
 * An example, it turns:
 *      <div <isif ... > class="wrapper">
 * into:
 *      <div ___________ class="wrapper">
 */
const maskNestedIsmlElements = content => {

    let result    = '';
    let depth     = 0;
    let firstTime = true;

    for (let i = 0; i < content.length; i++) {
        const currentChar = content.charAt(i);

        if (currentChar === '<') {
            depth += 1;
        }

        if (content.charAt(i - 1) === '>') {
            depth -= 1;
        }

        if (depth > 1) {
            result += '_';
        } else {
            result += content.charAt(i);
        }

        if (depth === 0 && firstTime) {
            firstTime = false;
        }
    }

    return result;
};

const maskInBetween = (content, startString, endString, isMaskBorders) => {

    let processedStartingString = startString;
    let processedEndString      = endString;

    if (!endString) {
        processedStartingString = `<${startString}>`;
        processedEndString      = `</${startString}>`;
    }

    return getMatchingIndexes(content, processedEndString, processedStartingString, isMaskBorders);
};

const getMatchingLists = (content, startString, endString) => {
    const openingMatchList    = [];
    const closingMatchList    = [];
    const emptyElementPattern = startString + endString;

    for (let i = 0; i < content.length; i++) {
        const substring = content.substring(i);

        if (substring.startsWith(startString)) {
            if (openingMatchList.length === closingMatchList.length && !substring.startsWith(emptyElementPattern)) {
                openingMatchList.push(i);
            }
        } else if (substring.startsWith(endString)) {
            if (openingMatchList.length === closingMatchList.length + 1) {
                closingMatchList.push(i);
            }
        }
    }

    return {
        openingMatchList,
        closingMatchList
    };
};

const maskInBetweenForTagWithAttributes = (content, rawStartString) => {

    const startingString = `<${rawStartString}>`;
    const endString      = `</${rawStartString}>`;
    return getMatchingIndexes(content, endString, startingString);
};

const getMatchingIndexes = (content, endString, startString, isMaskBorders) => {
    const matchingLists     = getMatchingLists(content, startString, endString);
    const openingMatchList  = matchingLists.openingMatchList;
    const closingMatchList  = matchingLists.closingMatchList;
    let result              = '';
    let isInBetween         = false;
    const currentOpeningTag = {
        endingGlobalPos : null,
        arrayIndex         : null
    };

    for (let i = 0; i < content.length; ++i) {
        if (isInBetween) {
            if (closingMatchList.indexOf(i) !== -1) {
                currentOpeningTag.endingGlobalPos = null;
                isInBetween                       = false;
                result                            += content[i];
            } else {
                result      += placeholderSymbol;
            }
        } else {
            const newLocal = openingMatchList.indexOf(i - 1);
            if (newLocal !== -1) {
                currentOpeningTag.endingGlobalPos = i;
                currentOpeningTag.arrayIndex      = newLocal;
            }

            isInBetween = currentOpeningTag.endingGlobalPos &&
             i >= currentOpeningTag.endingGlobalPos + startString.length - 1;

            if (openingMatchList[currentOpeningTag.arrayIndex] === closingMatchList[currentOpeningTag.arrayIndex]) {
                isInBetween                       = false;
                currentOpeningTag.arrayIndex      = null;
                currentOpeningTag.endingGlobalPos = null;
            }

            if (isInBetween) {
                result += placeholderSymbol;
            } else {
                result += content[i];
            }
        }
    }

    if (isMaskBorders) {
        const maskedStartString = mask(startString);
        const maskedEndString   = mask(endString);

        result = result
            .replace(new RegExp(startString, 'g'), maskedStartString)
            .replace(new RegExp(endString, 'g'), maskedEndString);
    }

    return result;
};

const mask = content => {
    let maskedContent = '';

    for (let i = 0; i < content.length; i++) {
        maskedContent += '_';
    }

    return maskedContent;
};

module.exports = {
    maskIgnorableContent,
    maskInBetween,
    maskInBetweenForTagWithAttributes
};
