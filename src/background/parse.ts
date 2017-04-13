import { hexToRGBA, parseMedia } from "./helpers"

export function parseCSS(css: string, originalCss: string, source: string, cssIndex: number) {

    let diffFound = false;
    let changedDeclaration = null;

    const commentre = /\/\*[^*]*\*+([^/*][^*]*\*+)*\//g

    function trim(str) {
        return str ? str.replace(/^\s+|\s+$/g, '') : '';
    }

    /**
    * Colors and fonts
    */

    var cssColors = []
    var cssFonts = []

    /**
     * Positional.
     */

    var lineno = 1;
    var column = 1;

    /**
     * Update lineno and column based on `str`.
     */

    function updatePosition(str) {
        var lines = str.match(/\n/g);
        if (lines) lineno += lines.length;
        var i = str.lastIndexOf('\n');
        column = ~i ? str.length - i : column + str.length;
    }

    /**
     * Mark position and patch `node.position`.
     */

    function position() {
        var start = { line: lineno, column: column }
        return function(node) {
            node.position = new Position(start)
            whitespace()
            return node;
        }
    }

    /**
     * Store position information for a node
     */

    function Position(start) {
        this.start = start;
        this.end = { line: lineno, column: column };
        this.source = source;
    }

    /**
     * Non-enumerable source string
     */

    Position.prototype.content = css;

    /**
     * Error `msg`.
     */

    var errorsList = [];

    function error(msg) {
        var error = ("CSS error: " + source + ':' + lineno + ':' + column + ': ' + msg)
    }

    /**
     * Parse stylesheet.
     */

    function stylesheet() {
        var rulesList = rules();

        return {
            type: 'stylesheet',
            stylesheet: {
                source: source,
                rules: rulesList,
                parsingErrors: errorsList
            }
        };
    }

    /**
     * Opening brace.
     */

    function open() {
        return match(/^{\s*/);
    }

    /**
     * Closing brace.
     */

    function close() {
        return match(/^}/);
    }

    /**
     * Parse ruleset.
     */

    function rules() {
        var node;
        var rules = []
        whitespace()
        comments(rules)
        // while (css.length && css.charAt(0) != '}' && (css.charAt(0) == originalCss.charAt(0)) && (node = atrule() || rule())) {
        while (!diffFound && css.length && css.charAt(0) != '}' && (node = atrule() || rule())) {
            if (node !== false) {
                rules.push(node)
                comments(rules)
            }
        }
        return rules;
    }

    /**
     * Match `re` and return captures.
     */

    function match(re) {
        var m = re.exec(css);
        if (!m) return;
        var str = m[0];
        updatePosition(str);
        css = css.slice(str.length);
        originalCss = originalCss.slice(str.length);

        return m;
    }

    /**
     * Parse whitespace.
     */

    function whitespace() {
        match(/^\s*/);
    }

    /**
     * Parse comments;
     */

    function comments(rules?: string[]) {
        var c;
        rules = rules || [];
        while (c = comment()) {
            if (c !== false) {
                rules.push(c);
            }
        }
        return rules;
    }

    /**
     * Parse comment.
     */

    function comment() {
        var pos = position();
        if ('/' != css.charAt(0) || '*' != css.charAt(1)) return;

        var i = 2;
        while ("" != css.charAt(i) && ('*' != css.charAt(i) || '/' != css.charAt(i + 1)))++i;
        i += 2;

        if ("" === css.charAt(i - 1)) {
            return error('End of comment missing');
        }

        var str = css.slice(2, i - 2);
        column += 2;
        updatePosition(str);
        css = css.slice(i);
        originalCss = originalCss.slice(i);

        column += 2;

        return pos({
            type: 'comment',
            comment: str
        });
    }

    /**
     * Parse selector.
     */

    function selector() {
        var m = match(/^([^{]+)/);
        if (!m) return;
        /* @fix Remove all comments from selectors
         * http://ostermiller.org/findcomment.html */
        return trim(m[0])
            .replace(/\/\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*\/+/g, '')
            .replace(/"(?:\\"|[^"])*"|'(?:\\'|[^'])*'/g, function(m) {
                return m.replace(/,/g, '\u200C');
            })
            .split(/\s*(?![^(]*\)),\s*/)
            .map(function(s) {
                return s.replace(/\u200C/g, ',');
            }).join(",");
    }

    /**
     * Parse declaration.
     */

    function declaration() {
        var pos = position();

        // prop
        var prop = match(/^(\*?[-#\/\*\\\w]+(\[[0-9a-z_-]+\])?)\s*/);
        if (!prop) return;
        prop = trim(prop[0]);

        // :
        if (!match(/^:\s*/)) return error("property missing ':'");

        // val
        let valRegex = /^((?:'(?:\\'|.)*?'|"(?:\\"|.)*?"|\]*?\)|[^};])+)/;
        let originalCssValue = valRegex.exec(originalCss);
        let newCssValue = match(valRegex);

        if (originalCssValue) {
            if(!diffFound && newCssValue[0] != originalCssValue[0]) diffFound = true;
        }

        newCssValue = newCssValue ? trim(newCssValue[0]).replace(commentre, '') : ''
        // Check for fonts and colors
        if (newCssValue) {
            let hexColors = newCssValue.match(/#([a-fA-F0-9]){3}(([a-fA-F0-9]){3})?/g)
            if(hexColors) hexColors.forEach(color =>{
               cssColors.push(hexToRGBA(color))
            })

            let rgbColors = newCssValue.match(/rgba?\(((25[0-5]|2[0-4]\d|1\d{1,2}|\d\d?)\s*,\s*?){2}(25[0-5]|2[0-4]\d|1\d{1,2}|\d\d?)\s*,?\s*([01]\.?\d*?)?\)/g);
            if(rgbColors) rgbColors.forEach(color =>{
               if(color.indexOf("rgba(0,0,0,0") !== 0) cssColors.push(color)
            })

            if (prop.replace(commentre, '') === "font-family") {
                let fontNames = trim(newCssValue).split(",").filter((font) => { return font.length > 0 && font !== "inherit" })
                if (fontNames) cssFonts = cssFonts.concat(fontNames)
            }

        }
        var ret = pos({
            //type: 'declaration',
            property: prop.replace(commentre, ''),
            value: newCssValue
        });

        // ;
        match(/^[;\s]*/);

        return ret;
    }

    /**
     * Parse declarations.
     */

    function declarations() {

        var decls = []

        if (!open()) return []
        comments(decls)

        // declarations
        var decl;
        while (decl = declaration()) {
            if (decl !== false) {
                decls.push(decl);
                comments(decls);
            }

            if(diffFound && !changedDeclaration) {
                changedDeclaration = decl
                console.log(decl)   
            }
        }

        if (!close()) return []
        return decls
    }

    /**
     * Parse keyframe.
     */

    function keyframe() {
        var m;
        var vals = [];
        var pos = position();

        while (m = match(/^((\d+\.\d+|\.\d+|\d+)%?|[a-z]+)\s*/)) {
            vals.push(m[1]);
            match(/^,\s*/);
        }

        if (!vals.length) return;

        return pos({
            type: 'keyframe',
            values: vals,
            declarations: declarations()
        });
    }

    /**
     * Parse keyframes.
     */

    function atkeyframes() {
        var pos = position();
        var m = match(/^@([-\w]+)?keyframes\s*/);

        if (!m) return;
        var vendor = m[1];

        // identifier
        var m = match(/^([-\w]+)\s*/);
        if (!m) return error("@keyframes missing name");
        var name = m[1];

        if (!open()) return error("@keyframes missing '{'");

        var frame;
        var frames = comments();
        while (frame = keyframe()) {
            frames.push(frame);
            frames = frames.concat(comments());
        }

        if (!close()) return error("@keyframes missing '}'");

        return pos({
            type: 'keyframes',
            name: name,
            vendor: vendor,
            keyframes: frames
        });
    }

    /**
     * Parse supports.
     */

    function atsupports() {
        var pos = position();
        var m = match(/^@supports *([^{]+)/);

        if (!m) return;
        var supports = trim(m[1]);

        if (!open()) return error("@supports missing '{'");

        var style = comments().concat(rules());

        if (!close()) return error("@supports missing '}'");

        return pos({
            type: 'supports',
            supports: supports,
            rules: style
        });
    }

    /**
     * Parse host.
     */

    function athost() {
        var pos = position();
        var m = match(/^@host\s*/);

        if (!m) return;

        if (!open()) return error("@host missing '{'");

        var style = comments().concat(rules());

        if (!close()) return error("@host missing '}'");

        return pos({
            type: 'host',
            rules: style
        });
    }

    /**
     * Parse media.
     */

    function atmedia() {
        var pos = position();
        var m = match(/^@media *([^{]+)/);

        if (!m) return

        const media = trim(m[1])

        if (!open()) return error("@media missing '{'");

        var style = comments().concat(rules());

        if (!close()) return error("@media missing '}'");
        const parsedMedia = parseMedia(media)

        return pos({
            type: 'media',
            media: media,
            queries: parsedMedia,
            rules: style
        })

    }


    /**
     * Parse custom-media.
     */

    function atcustommedia() {
        var pos = position();
        var m = match(/^@custom-media\s+(--[^\s]+)\s*([^{;]+);/);
        if (!m) return;
        return pos({
            type: 'custom-media',
            name: trim(m[1]),
            media: trim(m[2])
        });
    }

    /**
     * Parse paged media.
     */

    function atpage() {
        var pos = position();
        var m = match(/^@page */);
        if (!m) return;

        var sel = selector() || [];

        if (!open()) return error("@page missing '{'");
        var decls = comments();

        // declarations
        var decl;
        while (decl = declaration()) {
            decls.push(decl);
            decls = decls.concat(comments());
        }

        if (!close()) return error("@page missing '}'");

        return pos({
            type: 'page',
            selector: sel,
            declarations: decls
        });
    }

    /**
     * Parse document.
     */

    function atdocument() {
        var pos = position();
        var m = match(/^@([-\w]+)?document *([^{]+)/);
        if (!m) return;

        var vendor = trim(m[1]);
        var doc = trim(m[2]);

        if (!open()) return error("@document missing '{'");

        var style = comments().concat(rules());

        if (!close()) return error("@document missing '}'");

        return pos({
            type: 'document',
            document: doc,
            vendor: vendor,
            rules: style
        });
    }

    /**
     * Parse font-face.
     */

    function atfontface() {
        var pos = position();
        var m = match(/^@font-face\s*/);
        if (!m) return;

        if (!open()) return error("@font-face missing '{'");
        var decls = comments();

        // declarations
        var decl;
        while (decl = declaration()) {
            decls.push(decl);
            decls = decls.concat(comments());
        }

        if (!close()) return error("@font-face missing '}'");

        return pos({
            type: 'font-face',
            declarations: decls
        });
    }

    /**
     * Parse import
     */

    var atimport = _compileAtrule('import');

    /**
     * Parse charset
     */

    var atcharset = _compileAtrule('charset');

    /**
     * Parse namespace
     */

    var atnamespace = _compileAtrule('namespace');

    /**
     * Parse non-block at-rules
     */


    function _compileAtrule(name) {
        var re = new RegExp('^@' + name + '\\s*([^;]+);');
        return function() {
            var pos = position();
            var m = match(re);
            if (!m) return;
            var ret = { type: name };
            ret[name] = m[1].trim();
            return pos(ret);
        }
    }

    /**
     * Parse at rule.
     */

    function atrule() {
        if (css[0] != '@') return;

        return atkeyframes()
            || atmedia()
            || atcustommedia()
            || atsupports()
            || atimport()
            || atcharset()
            || atnamespace()
            || atdocument()
            || atpage()
            || athost()
            || atfontface();
    }

    /**
     * Parse rule.
     */

    function rule() {
        var pos = position();
        var sel = selector();

        if (!sel) return error('selector missing');
        comments();

        return pos({
            type: 'rule',
            selector: sel,
            declarations: declarations()
        });
    }

    function flattenTree(finalCSS, currentMedia?) {

        let output = []
        let media = currentMedia || {
            media: "",
            position: null,
            queries: [{
               width:{
                  min: 0,
                  max: 9000
               },
               height:{
                  min: 0,
                  max: 9000
               }
            }]
        }

        finalCSS.forEach((rule) => {

            rule.index = cssIndex

            if (rule.type === "rule") {
                rule.media = media
                delete rule.type
                output.push(rule)
            }
            // TODO: Check print media rule possible variations
            else if (rule.type === "media" && rule.rules.length > 0 && rule.media !== "print") {

                currentMedia = {
                    media: rule.media.replace("screen and ", ""),
                    position: rule.position,
                    queries: rule.queries
                }

                let childRules = flattenTree(rule.rules, currentMedia)
                output = output.concat(childRules)

            }

        })

        return output

    }

    const finalCSS = rules()
    let finalRules = flattenTree(finalCSS)

    if(diffFound) {
        let rule = finalRules.pop()
        rule.declarations = [changedDeclaration]

        return rule
    } else return null

//    return {
//       rules: finalRules,
//       colors: cssColors,
//       fonts: cssFonts
//    }

}

export function parseInline(inlineRules){

   let result = []

   if(inlineRules == '' || inlineRules==null) return []

   inlineRules = inlineRules.replace(/[\r\n]/gm, '').split(';')

   inlineRules.forEach(inlineRule => {

      inlineRule = inlineRule.replace(/^\s+|\s+$/g, '')
      if(inlineRule === '') return

      var matches = inlineRule.split(':')
      while(matches.length > 2) { matches[1] += ':' + matches.pop() }

      if(matches.length == 1) return

      const attribute = matches[0].replace(/^\s+|\s+$/g, '')

      result.push({
         attribute: attribute,
         value: matches[1].replace(/^\s+|\s+$/g, '')
      })

   })

   return result

}
