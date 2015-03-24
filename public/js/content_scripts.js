chrome.runtime.onMessage.addListener(function (body) {
    chrome.runtime.sendMessage({
        url: window.location.host,
        html: window.document.body.innerHTML
    }, function(resp) {
        console.log(resp);
    });
});