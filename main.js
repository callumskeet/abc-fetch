const fs = require("fs");
const fetch = require("node-fetch");
const ProgressBar = require("progress");

const API_KEY = "54564fe299e84f46a57057266fcf233b";

const DEFAULT_OPTIONS = {
    size: 2000,
    doctype: "article",
    offset: 0,
};

const logErr = (err) => {
    if (err) {
        return console.error(err);
    }
};

const search = (options) => {
    if (typeof options === "undefined") {
        options = DEFAULT_OPTIONS;
    }
    if (typeof options.limit === "undefined") {
        options.limit = DEFAULT_OPTIONS.limit;
    }
    if (typeof options.doctype === "undefined") {
        options.doctype = DEFAULT_OPTIONS.doctype;
    }
    if (typeof options.offset === "undefined") {
        options.offset = DEFAULT_OPTIONS.offset;
    }

    var url =
        "https://api.abc.net.au" +
        "/terminus/api/v1/search/coremedia?" +
        `limit=${options.size}&` +
        `doctype=${options.doctype}&` +
        `offset=${options.offset}&` +
        `apikey=${API_KEY}`;

    return fetch(url)
        .then((res) => res.json())
        .then((data) => {
            var ids = [];
            data._embedded.content.forEach((result) => {
                ids.push(result.id);
            });
            fs.appendFile(
                "data/search-results.txt",
                "\n" + ids.join("\n"),
                logErr
            );
            return data.pagination;
        })
        .catch(console.error);
};

const fetchArticle = async (id) => {
    var url =
        "https://api.abc.net.au" +
        "/terminus/api/v1/content/coremedia/article/" +
        `${id}?` +
        `apikey=${API_KEY}`;

    return fetch(url)
        .then((res) => res.json())
        .then(processArticle)
        .then((article) => {
            fs.writeFile(
                `data/articles/${article.id}.json`,
                JSON.stringify(article),
                logErr
            );
        })
        .catch((reason) => {
            fs.appendFile("data/missing-articles.txt", `${id}\n`, logErr);
        });
};

const processArticle = async (data) => {
    try {
        let article = {
            id: data.id,
            title: data.title,
            synopsis: data.synopsis,
            body: [],
            keywords: data.keywords,
            url: data.canonicalURL,
            published: data.dates.published,
            updated: data.dates.updated,
            genre: data.genre,
            productionUnit: data.productionUnit,
            rightsHolder: data.rightsHolder,
            lang: data.lang,
            importance: data.importance,
            version: data.version,
        };
        for (let i = 0; i < data.text.children.length; i++) {
            const x = data.text.children[i];
            if (typeof x.children === "undefined") {
                continue;
            }
            let paragraph = "";
            for (let j = 0; j < x.children.length; j++) {
                const y = x.children[j];
                let content = y.content;
                if (y.tagname === "br") {
                    content = "\n";
                } else if (typeof content === "undefined") {
                    content = "";
                    if (typeof y.children === "undefined") {
                        continue;
                    }
                    for (let k = 0; k < y.children.length; k++) {
                        const z = y.children[k];
                        content += z.content;
                    }
                }
                paragraph += content;
            }
            article.body.push(paragraph);
        }
        return article;
    } catch (error) {
        console.error(error);
        return;
    }
};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const retryFetch = (url, delay, retries) =>
    new Promise((resolve, reject) => {
        return fetch(url)
            .then(resolve)
            .catch((reason) => {
                if (retries > 0) {
                    return wait(delay)
                        .then(retryFetch.bind(url, delay, retries - 1))
                        .then(resolve)
                        .catch(reject);
                }
                return reject(reason);
            });
    });

const fetchAllIds = async () => {
    var opts = await search();
    var bar = new ProgressBar("[:bar] :rate/bps :percent :etas", {
        total: opts.total - DEFAULT_OPTIONS.offset,
        complete: "=",
        incomplete: " ",
        width: 30,
    });
    while (opts.offset < opts.total) {
        opts.offset += opts.size;
        opts = await search(opts);
        bar.tick(opts.size);
    }
};

(async () => {
    var articleIds = fs
        .readFileSync("data/search-results.txt", "utf8")
        .split("\r\n")
        .slice(1);
    var bar = new ProgressBar("[:bar] :rate/bps :percent :etas", {
        total: articleIds.length,
        complete: "=",
        incomplete: " ",
        width: 30,
    });

    var savedArticles = fs.readdirSync("data/articles");
    for (let i = 0; i < savedArticles.length; i++) {
        savedArticles[i] = savedArticles[i].split(".")[0];
    }

    for (let i = 0; i < articleIds.length; i++) {
        const id = articleIds[i];
        if (savedArticles.includes(id)) {
            bar.tick(1);
        } else {
            await fetchArticle(parseInt(id))
            bar.tick(1);
        }
    }
})();
