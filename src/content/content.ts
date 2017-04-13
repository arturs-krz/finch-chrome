const runtimePort = chrome.runtime.connect({ name: 'devtools' })


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    
    switch (message.request) {
        case 'load':
            console.log('Fetching stylesheets')
            loadStylesheets()
            break;
    }
    return true;
})

const loadStylesheets = () => {
    Array.prototype.filter
        .call(document.styleSheets, sheet => sheet.href)
        .map(sheet => sheet.href)
        .forEach((url, index) => {
            const http: XMLHttpRequest = new XMLHttpRequest()
            http.open('GET', url, true)
            http.onreadystatechange = () => {
                if (http.readyState == 4 && http.status == 200) {
                    const contentType = http.getResponseHeader('Content-Type')
                    const css: StylesheetObject = {
                        // source: url.match(/[^\/]*\.css/gi).pop(),
                        source: url,
                        content: http.responseText,
                        utf8: /utf-8/i.test(contentType)
                    }
                    chrome.runtime.sendMessage({ type: 'cssFetch', css: css })
                }
            }
            http.send()
        })
}




