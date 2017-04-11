const runtimePort = chrome.runtime.connect({ name: 'devtools' })


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('chrome.runtime')
    switch (message.type) {
        case 'log':
            console.log(message.message)
            break;
    }
    return true;
})

window.addEventListener('message', event => {
    console.log(event)
})



Array.prototype.filter
    .call(document.styleSheets, sheet => sheet.cssRules == null && sheet.href.indexOf('.css') !== -1)
    .map(sheet => sheet.href)
    .forEach((url, index) => {
        const http: XMLHttpRequest = new XMLHttpRequest()
        http.open('GET', url, true)
        http.onreadystatechange = () => {
            if (http.readyState == 4 && http.status == 200) {
                const css: StylesheetObject = {
                    // source: url.match(/[^\/]*\.css/gi).pop(),
                    source: url,
                    content: http.responseText
                }
                chrome.runtime.sendMessage({ type: 'cssFetch', css: css })
            }
        }
        http.send()
    })





