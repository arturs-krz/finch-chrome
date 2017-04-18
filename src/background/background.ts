import fixEncoding from "./fixEncoding"
import { parseCSS } from "./parse"
declare const $0: any

interface StylesheetObject {
    source: string,
    content: string,
    utf8: boolean
}

interface RulesContainer {
    [domainName: string]: {
        [ruleName: string]: Object[]
    }
}

let currentDomain: string = null
const tabDomains: Object = {}

/**
 * Rulesets for different domains (from chrome storage)
 */
const styleRules: RulesContainer = {}

/**
 * Gets style rules for the given domain from chrome storage
 */
const getDomainRules = (domain: string) => {
    const rulesetId = 'rules_' + domain
    chrome.storage.local.get(rulesetId, items => {
        if(items[rulesetId]) {
            console.log('Fetched rules for domain: ' + domain)
            styleRules[domain] = items[rulesetId]
            console.log(styleRules)
        }
    })
}

const storeDomainRules = (domain: string) => {
    if(styleRules.hasOwnProperty(domain)) {
        console.log('Saving rules for ' + domain)
        const rulesetId = 'rules_' + domain
        const toStore = {}
        toStore[rulesetId] = styleRules[domain]
        chrome.storage.local.set(toStore)
    }
}

const getDomainFromUrl = (url: string) => {
    const domainRegex = /\/\/([^\/?#]+)/i
    const result = domainRegex.exec(url)
    if(result) {
        console.log(result[1])
        return result[1]
    } else return null
}

const loadStylesheetsForCurrentTab = (tabId: number) => {
    let loaded = false
    for(let source in stylesheets) {
        if(stylesheets[source].tab == tabId) {
            console.log('Stylesheets for ' + tabId + ' already loaded')
            loaded = true
            break
        }
    }
    if(!loaded) chrome.tabs.sendMessage(tabId, { request: 'load'})
}

/**
 * Contains currently loaded full css files
 */
const stylesheets: Object = {}

// chrome.storage.local.clear()

const removeStylesheet = (tabId) => {
    for (let source in stylesheets) {
        if (stylesheets[source].tab == tabId) {
            console.log('Removing ' + source + ' for tab ' + tabId)
            delete stylesheets[source]
        }
    }
}
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    let domain = tabDomains[tabId]
    storeDomainRules(domain)        // store rules when tab is closed
    removeStylesheet(tabId)
    delete tabDomains[tabId]
})

chrome.tabs.onActivated.addListener(activeInfo => {
    console.log('Activated tab ' + activeInfo.tabId)

    chrome.tabs.sendMessage(activeInfo.tabId, { request: 'ping' }, response => {
        if(response != 'pong') {
            chrome.tabs.executeScript(null, {file: 'content.js'}, result => {
                loadStylesheetsForCurrentTab(activeInfo.tabId)
            })
        } else {
            loadStylesheetsForCurrentTab(activeInfo.tabId)
        }
    })

    chrome.tabs.get(activeInfo.tabId, tab => {
        if(tab.url) {
            currentDomain = getDomainFromUrl(tab.url)
            tabDomains[tab.id] = currentDomain
            getDomainRules(currentDomain)
        }
    })

    
})
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if(changeInfo.url) {
        storeDomainRules(currentDomain) // save previous 

        currentDomain = getDomainFromUrl(changeInfo.url)
        tabDomains[tabId] = currentDomain
        console.log('Loaded ' + currentDomain)
        getDomainRules(currentDomain)
    } else if(currentDomain != null) storeDomainRules(currentDomain)

    loadStylesheetsForCurrentTab(tabId)
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
    
        case 'log':
            console.log(message.message)
            break

        case 'cssFetch':
            let stylesheetObj: StylesheetObject = message.css
            const currentTabId = sender.tab.id

            if (!stylesheets.hasOwnProperty(stylesheetObj.source)) {
                stylesheets[stylesheetObj.source] = {
                    content: stylesheetObj.content,
                    utf8: stylesheetObj.utf8,
                    tab: currentTabId
                }
                console.log('Loaded stylesheet ' + stylesheetObj.source)
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

    if (stylesheets.hasOwnProperty(source)) {

        if (!stylesheets[source].utf8) {
            changedCss = fixEncoding(changedCss)
        }

        const rule = parseCSS(changedCss, stylesheets[source].content, source, 0)
        if(rule) {
            console.log(rule)

            // Replace source stylesheet with modified one (for comparison only)
            stylesheets[source].content = changedCss

            // Save the new rule for the active domain
            if(!styleRules.hasOwnProperty(currentDomain)) styleRules[currentDomain] = {}
            if(!styleRules[currentDomain].hasOwnProperty(rule.selector)) {
                styleRules[currentDomain][rule.selector] = [rule]
            } else {
                styleRules[currentDomain][rule.selector].push(rule)
            }
        }
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