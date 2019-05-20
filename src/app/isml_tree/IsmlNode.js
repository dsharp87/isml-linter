const MAX_TEXT_DISPLAY_SIZE = 30;

const ConfigUtils = require('../util/ConfigUtils');
const Constants   = require('../Constants');

class IsmlNode {

    constructor(value = '(root)', lineNumber = 0, globalPos) {
        this.value            = value;
        this.lineNumber       = lineNumber;
        this.globalPos        = globalPos;
        this.type             = null;
        this.depth            = 0;
        this.suffixValue      = '';
        this.suffixLineNumber = -1;
        this.suffixGlobalPos  = -1;
        this.type             = null;
        this.innerText        = null;
        this.parent           = null;
        this.children         = [];
    }

    setSuffix(value, lineNumber, globalPos) {
        this.suffixValue      = value;
        this.suffixLineNumber = lineNumber;
        this.suffixGlobalPos  = globalPos;
    }

    setValue(value) { this.value = value; }
    getValue() { return this.value; }
    getLineNumber() { return this.lineNumber; }

    getType() {
        const value = this.value.trim();

        if (value.startsWith('<!--')) {
            return 'html_comment';
        } else if (this.isDocType()) {
            return 'doctype';
        } else if (this.isDynamicElement()) {
            return 'dynamic_element';
        } else if (this.isMulticlause()) {
            return 'multi_clause';
        }

        const regex = /<[a-zA-Z\d_]*(\s|>|\/)/g;

        return value.match(regex)[0].slice(1, -1);
    }

    isDocType() {
        return this.value.toLowerCase().trim().startsWith('<!doctype ');
    }

    isDynamicElement() {
        return this.value.trim().startsWith('<${');
    }

    getDepth() { return this.depth; }
    getParent() { return this.parent; }
    getGlobalPos() { return this.globalPos; }

    getSuffixValue() { return this.suffixValue; }
    getSuffixLineNumber() { return this.suffixLineNumber; }
    getSuffixGlobalPos() { return this.suffixGlobalPos; }

    getAttributeList() {
        if (!this.isHtmlTag() && !this.isIsmlTag()) {
            return [];
        }

        const trimmedValue   = this.value.trim();
        const processedValue = trimmedValue.substring(1, trimmedValue.length - 1);

        return parseAttributes(processedValue);
    }

    addChild(newNode) {
        newNode.depth        = this.depth+1;
        newNode.parent       = this;
        this.children.push(newNode);
        this.newestChildNode = newNode;
    }

    getChild(number) { return this.children[number]; }
    getLastChild() { return this.children[this.children.length - 1];}
    getNumberOfChildren() { return this.children.length; }

    getIndentationSize() {
        const precedingEmptySpacesLength = this.getValue().search(/\S|$/);
        const precedingEmptySpaces       = this.getValue().substring(0, precedingEmptySpacesLength);
        const lastLineBreakPos           = precedingEmptySpaces.lastIndexOf('\n');
        const indentationSize            = precedingEmptySpaces.substring(lastLineBreakPos).length;

        return Math.max(indentationSize - 1, 0);
    }

    isRoot() { return !this.parent; }
    isMulticlause() { return false; }
    isScriptContent() {
        return this.parent && this.parent.isOfType('isscript');
    }

    isTag() {
        const value = this.value.trim();

        return value.startsWith('<') &&
            value.endsWith('>');
    }

    isHtmlTag() {
        const value = this.value.trim();

        return value.startsWith('<') &&
            !value.startsWith('<is') &&
            value.endsWith('>');
    }

    isIsmlTag() {
        return this.value.trim().startsWith('<is');
    }

    isExpression() {
        const value = this.value.trim();

        return value.startsWith('${') &&
            value.endsWith('}');
    }

    isIsmlComment() {
        const value = this.value.trim();

        return value === '<iscomment>';
    }

    isHtmlComment() {
        const value = this.value.trim();

        return value.startsWith('<!--') &&
            value.endsWith('-->');
    }

    isCommentContent() {
        return this.parent && this.parent.isIsmlComment();
    }

    isVoidElement() {
        const config = ConfigUtils.load();

        return !config.disableHtml5 && Constants.voidElementsArray.indexOf(this.getType()) !== -1;
    }

    isSelfClosing() {
        return !this.isMulticlause() && (
            this.isDocType() ||
            this.isVoidElement() ||
            this.isHtmlComment() ||
            this.isTag() && this.value.endsWith('/>'));
    }

    isOfType(type) {
        return typeof type === 'string' ?
            !this.isRoot() && this.getType() === type :
            type.some( elem => elem === this.getType());
    }

    isEmpty() {
        return !this.value.trim();
    }

    isLastChild()  {
        return !this.parent || this.parent.getLastChild() === this;
    }

    print() {
        const indentSize = this.depth;
        let indentation  = '';

        for (let i = 0; i < indentSize; ++i) {
            indentation += '    ';
        }

        console.log(this.depth + ' :: ' + this.lineNumber + ' :: ' + indentation + this.getDisplayText());

        if (this.children.length > 0) {
            this.children.forEach( node => node.print() );
        }
    }

    getFullContent(stream = '') {

        if (!this.isMulticlause() && this.isEmpty() && !this.isLastChild()) {
            return stream;
        }

        if (!this.isRoot() && !this.isMulticlause()) {
            stream += this.value;
        }

        this.children.forEach( node => stream = node.getFullContent(stream) );

        if (!this.isRoot() && !this.isMulticlause()) {
            stream += this.suffixValue;
        }

        return stream;
    }

    // === Helper, "private" methods;

    getDisplayText() {
        let displayText = this.value;

        displayText = displayText
            .replace(/\n/g, '')
            .replace(/ +(?= )/g, '');

        if (this.value.length > MAX_TEXT_DISPLAY_SIZE - 3) {
            displayText = displayText.substring(0, MAX_TEXT_DISPLAY_SIZE - 3) + '...';
        }

        return displayText.trim();
    }
}

const parseAttributes = nodeValue => {
    const rawAttrNodeValue = nodeValue.split(' ').slice(1).join(' ');
    let outsideQuotes      = true;

    const maskedContent = rawAttrNodeValue.split('').map( (char, i) => {

        if (i > 2 && rawAttrNodeValue[i-2] === '=' && rawAttrNodeValue[i-1] === '"') {
            outsideQuotes = false;
        }

        if (i > 2 && rawAttrNodeValue[i-1] !== '=' && char === '"') {
            outsideQuotes = true;
        }

        return outsideQuotes ? char : '_';
    }).join('');

    const blankSpaceIndexesArray = maskedContent
        .split('')
        .map((e, i) => e === ' ' ? i : '')
        .filter(String);

    const stringifiedAttributesArray = [];

    blankSpaceIndexesArray.forEach( (spacePosition, i) => {
        stringifiedAttributesArray.push(i === 0 ?
            rawAttrNodeValue.substring(0, spacePosition) :
            rawAttrNodeValue.substring(blankSpaceIndexesArray[i - 1], spacePosition));
    });

    const lastAttribute = rawAttrNodeValue.substring(blankSpaceIndexesArray[blankSpaceIndexesArray.length - 1] + 1, rawAttrNodeValue.length);
    if (lastAttribute && lastAttribute !== '/') {
        stringifiedAttributesArray.push(lastAttribute);
    }

    const attributesArray = stringifiedAttributesArray.map( attr => {
        const attributeProps = attr.split('=');
        const value          = attributeProps[1] ? attributeProps[1].substring(1, attributeProps[1].length - 1) : null;
        const values         = value ? value.split(' ') : null;

        return {
            name   : attributeProps[0],
            value  : value,
            values : values
        };
    });

    return attributesArray;
};

module.exports = IsmlNode;
