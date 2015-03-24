// if you checked "fancy-settings" in extensionizr.com, uncomment this lines

// var settings = new Store("settings", {
//     "sample_setting": "This is how you use Store.js to remember values"
// });
var getJSON = require('./getJSON');
var lda = require('lda');
var read = require('read-art');
var svrUrl = "http://localhost:8070/api/simi?";
var siteURL;
var siteTitle;

function run(html) {
    var time1 = Date.now();

    read(html, {output: 'text'}, function(err, art, options) {
        if (err) {
            throw err;
        }

        var title = art.title;
        var content = art.content;
        var time2 = Date.now()
        console.log('extract time: ', time2 - time1)
        var topics = LDA(content).map(function(e) {
            return e.slice(0,2);
        });
        topics = topics[0].concat(topics[1]).map(function(e) {
            return e.term;
        });
        console.log(topics);
        var time3 = Date.now()
        console.log('lda time: ', time3 - time2);

        var cates = getCates();

        var url = svrUrl + 'topics=' + topics.join('-') + '&cates=' + cates.join('-');

        console.log(url);

        getSimilarity(url).then(function(scores) {
            var time4 = Date.now();
            console.log('server time: ', time4 - time3);
            console.log(scores);
            // var topicDict = {};
            // scores.map(function(e) {
            //     topicDict[e.words[1]] = topicDict[e.words[1]] || 0;
            //     topicDict[e.words[1]] += e.score;
            // });
            // console.log(topicDict);
            var score = -10, key;
            Object.keys(scores.scores).map(function(e) {
                if (scores.scores[e] > score) {
                    score = scores.scores[e];
                    key = e;
                }
            });
            var queue = JSON.parse(window.localStorage.getItem('bmqueue') || "[]")
            queue.push({ categoryName: key, title: siteTitle, url: siteURL, topics: topics});
            window.localStorage.setItem('bmqueue', JSON.stringify(queue));
        });


    });
}

// output sample
// [ [ { term: 'dogs', probability: 0.2 },
//     { term: 'cats', probability: 0.2 },
//     { term: 'small', probability: 0.1 },
//     { term: 'mice', probability: 0.1 },
//     { term: 'chase', probability: 0.1 } ],
//   [ { term: 'dogs', probability: 0.2 },
//     { term: 'cats', probability: 0.2 },
//     { term: 'bones', probability: 0.11 },
//     { term: 'eat', probability: 0.1 },
//     { term: 'big', probability: 0.099 } ] ]

function LDA(content) {
    var documents = content.match(/[^\.!\?]+[\.!\?]+/g);
    var result = lda(documents, 2, 5);
    return result;
}

function getCates() {
    var cates = [];
    try {
        cates = JSON.parse(window.localStorage.getItem('groups')).map(function(g) {
            return g.name;
        });
    } catch(e) {
        console.log(e);
    }
    return cates;
}

function getCatesMock() {
    return ['book', 'movie', 'history', 'game', 'technology', 'javascript', 'programming'];
}

function chooseCategory(topics) {

    for (var i in cates) {
        var cate = cates[i];
        var cateText = cate.title;
        cate.score = 0;
        for (var j in topics) {
            var topic = topics[j];
            cate.score += model.similarity(cateText, topic);
        }
    }

    cates.sort(function(a, b) {
        return a.score - b.score;
    });
    return cates[0];
}

function getSimilarity(url) {
    return getJSON(url).then(function(scores) {
        return scores;
    }).catch(function() {
        console.log('error in promise');
    });
}

//example of using a message handler from the inject scripts
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(sender.tab);
    run(request.html);
  	// chrome.pageAction.show(sender.tab.id);
    // sendResponse();
  });

chrome.browserAction.onClicked.addListener(function (tab) {
    siteURL = tab.url;
    siteTitle = tab.title;
    console.log(tab);
    chrome.tabs.sendMessage(tab.id, 'getHtml', function(tab) {
        console.log(tab);
    });
    // run(tabs[0].html);
});