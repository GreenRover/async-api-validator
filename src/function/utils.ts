import * as YAML from 'js-yaml';

export class Utils {
    public static toJS(asyncapiYAMLorJSON: any): any {
        if (!asyncapiYAMLorJSON) {
            throw new ParserError({
                type: 'null-or-falsey-document',
                title: 'Document can\'t be null or falsey.',
            });
        }

        if (asyncapiYAMLorJSON.constructor && asyncapiYAMLorJSON.constructor.name === 'Object') {
            return asyncapiYAMLorJSON;
        }

        if (typeof asyncapiYAMLorJSON !== 'string') {
            throw new ParserError({
                type: 'invalid-document-type',
                title: 'The AsyncAPI document has to be either a string or a JS object.',
            });
        }
        if (asyncapiYAMLorJSON.trimLeft().startsWith('{')) {
            try {
                return JSON.parse(asyncapiYAMLorJSON);
            } catch (e) {
                throw new ParserError({
                    type: 'invalid-json',
                    title: 'The provided JSON is not valid.',
                    detail: e.message,
                    location: {
                        startOffset: e.offset,
                        startLine: e.startLine,
                        startColumn: e.startColumn,
                    },
                });
            }
        } else {
            try {
                return YAML.safeLoad(asyncapiYAMLorJSON);
            } catch (err) {
                throw new ParserError({
                    type: 'invalid-yaml',
                    title: 'The provided YAML is not valid.',
                    detail: err.message,
                    location: {
                        startOffset: err.mark.position,
                        startLine: err.mark.line + 1,
                        startColumn: err.mark.column + 1,
                    },
                });
            }
        }
    }

    public static ucFirst(s: string): string {
        return s.charAt(0).toUpperCase() + s.slice(1);
    }
}

const ERROR_URL_PREFIX = 'https://github.com/asyncapi/parser-js/';

const buildError = (from, to) => {
    to.type = from.type.startsWith(ERROR_URL_PREFIX) ? from.type : `${ERROR_URL_PREFIX}${from.type}`;
    to.title = from.title;
    if (from.detail) to.detail = from.detail;
    if (from.validationErrors) to.validationErrors = from.validationErrors;
    if (from.parsedJSON) to.parsedJSON = from.parsedJSON;
    if (from.location) to.location = from.location;
    if (from.refs) to.refs = from.refs;
    return to;
};

export class ParserError extends Error {
    constructor(def) {
        super();
        buildError(def, this);
        this.message = def.title;
    }

    toJS() {
        return buildError(this, {});
    }
}
