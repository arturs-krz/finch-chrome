const log = msg => {
    chrome.runtime.sendMessage({ type: 'log', message: msg })
}

const port = chrome.runtime.connect({ name: "devtools" })
// chrome.runtime.sendMessage({
//     type: 'inject',
//     tabId: chrome.devtools.inspectedWindow.tabId,
//     scriptToInject: "content.js"
// })

// chrome.debugger.sendCommand({tabId: chrome.devtools.inspectedWindow.tabId}, "DOM.enable", {})
// chrome.debugger.attach({tabId: chrome.devtools.inspectedWindow.tabId}, "0.1", () => {
//     log(chrome.runtime.lastError)
// })

chrome.devtools.panels.elements.onSelectionChanged.addListener(() => {
    // chrome.devtools.inspectedWindow.eval("console.log(window.getMatchedCSSRules($0))")
    // chrome.devtools.inspectedWindow.eval("console.log(window.getComputedStyle($0))")
})

chrome.devtools.inspectedWindow.onResourceContentCommitted.addListener((resource, content) => {
    // chrome.devtools.inspectedWindow.eval("console.log('changed props')")
    if(resource.type == 'stylesheet') {
        chrome.runtime.sendMessage({ type: 'cssChange', source: resource.url, css: content })
    }
})





// chrome.runtime.onConnect.addListener(devToolsConnection => {
//     const listener = (message, sender, sendResponse) => {
//         console.log(message.test)
//     }
//     devToolsConnection.onMessage.addListener(listener)
// })

// chrome.devtools.inspectedWindow.eval("console.log('wtfkek')")

// chrome.devtools.panels.create("My Panel",
//     null,
//     "panel.html",
//     function(panel) {
//       // code invoked on panel creation
//       console.log('wtf')
//     }
// )