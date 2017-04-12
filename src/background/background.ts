import fixEncoding from "./fixEncoding"
import { parseCSS } from "./parse"
declare const $0: any

interface StylesheetObject {
    source: string,
    content: string,
    utf8: boolean
}

const stylesheets: Object = {}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
        case 'inject':
            let tabId = message.tabId
            console.log(tabId)
            chrome.tabs.executeScript(tabId, {file: message.scriptToInject})

            // startDebugger(tabId)
            break

        case 'log':
            console.log(message.message)
            break

        case 'cssFetch':
            let stylesheetObj: StylesheetObject = message.css
            if(!stylesheets.hasOwnProperty(stylesheetObj.source)) {
                stylesheets[stylesheetObj.source] = {
                    content: stylesheetObj.content,
                    utf8: stylesheetObj.utf8
                }
                console.log(stylesheets)
            }
            break

        case 'cssChange':
            // parseCSS(message.css, message.source, 0)
            cssDiff(message.source, message.css)
            break
    }
    return true;
})

const cssDiff = (source, changedCss) => {
    
    if(stylesheets.hasOwnProperty(source)) {

        if(!stylesheets[source].utf8) {
            changedCss = fixEncoding(changedCss)
        }

        const parsed = parseCSS(changedCss, stylesheets[source].content, source, 0)
        stylesheets[source].content = changedCss

        // let sourceLength = stylesheets[source].length

        // for(let i = 0; i < sourceLength; i++) {
        //     // Find first diff position
        //     if (stylesheets[source][i] !== changedCss[i]) {


        //         let ruleEndPos
        //         for (ruleEndPos = i; ruleEndPos < sourceLength; ruleEndPos++) {
        //             if (stylesheets[source][ruleEndPos] == ';' || stylesheets[source][ruleEndPos] == '}') break
        //         }

        //         // Go back to get the rule
        //         for (let j = i; j >= 0; j--) {
        //             if(stylesheets[source][j] == '}') {
        //                 i = j+1
        //                 break
        //             }
        //         }

        //         let fullRule = changedCss.substring(i, ruleEndPos)
        //         let ruleParts = fullRule.split('{')
        //         let selector = ruleParts[0]
        //         let style = ruleParts[1].split(';').pop()
                
        //         console.log(fullRule)
        //         console.log([selector, style])
                
        //         // console.log(changedCss.substring(i, ruleEndPos))


        //         stylesheets[source] = changedCss
        //         break
        //     }
        // }

    } else {
        console.log('nope')
    }
}

// const startDebugger = (tabId) => {
//     chrome.debugger.attach({ tabId: tabId }, "1.0", () => {
//         console.log(chrome.runtime.lastError)

//         chrome.debugger.sendCommand({ tabId: tabId }, "Debugger.enable", {}, () => {
//             console.log('debugger enabled')
//         })
//         chrome.debugger.sendCommand({ tabId: tabId }, "DOM.enable", {}, () => {
//             console.log('dom enabled')
//         }) 
//     })
// }



// chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
//     console.log('Tabs onUpdate')

// });


// chrome.debugger.sendCommand(tabId, "getMatchedStylesForNode", {

// }, result => {
//     console.log(result)
// })


// {
//     "name": "getMatchedStylesForNode",
//         "parameters": [
//             { "name": "nodeId", "$ref": "DOM.NodeId" }
//         ],
//             "returns": [
//                 { "name": "inlineStyle", "$ref": "CSSStyle", "optional": true, "description": "Inline style for the specified DOM node." },
//                 { "name": "attributesStyle", "$ref": "CSSStyle", "optional": true, "description": "Attribute-defined element style (e.g. resulting from \"width=20 height=100%\")." },
//                 { "name": "matchedCSSRules", "type": "array", "items": { "$ref": "RuleMatch" }, "optional": true, "description": "CSS rules matching this node, from all applicable stylesheets." },
//                 { "name": "pseudoElements", "type": "array", "items": { "$ref": "PseudoElementMatches" }, "optional": true, "description": "Pseudo style matches for this node." },
//                 { "name": "inherited", "type": "array", "items": { "$ref": "InheritedStyleEntry" }, "optional": true, "description": "A chain of inherited styles (from the immediate node parent up to the DOM tree root)." },
//                 { "name": "cssKeyframesRules", "type": "array", "items": { "$ref": "CSSKeyframesRule" }, "optional": true, "description": "A list of CSS keyframed animations matching this node." }
//             ],
//                 "description": "Returns requested styles for a DOM node identified by <code>nodeId</code>."
// },