const fs = require("fs");
const fetch = require("node-fetch");
const ProgressBar = require("progress");
const { options } = require("yargs");
const yargs = require("yargs");

const API_KEY = "54564fe299e84f46a57057266fcf233b"; // https://github.com/abcnews/terminus-fetch/blob/master/src/index.ts

const DEFAULT_OPTIONS = {
    limit: 2000,
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
        `limit=${options.limit}&` +
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
            fs.appendFile(options.file, "\n" + ids.join("\n"), logErr);
            return data.pagination;
        })
        .catch(console.error);
};

const fetchArticle = async (id, outdir) => {
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
                `${outdir}/${article.id}.json`,
                JSON.stringify(article),
                logErr
            );
        })
        .catch((reason) => {
            fs.appendFile("log/missing-articles.txt", `${id}\n`, logErr);
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

const fetchArticlesFromIds = async (options) => {
    var articleIds = fs
        .readFileSync(options.file, "utf8")
        .split(/\r?\n/)
        .slice(1);
    
    var bar = new ProgressBar("[:bar] :rate/bps :percent :etas", {
        total: articleIds.length,
        complete: "=",
        incomplete: " ",
        width: 30,
    });

    var savedArticles = fs.readdirSync(options.dir);
    for (let i = 0; i < savedArticles.length; i++) {
        savedArticles[i] = savedArticles[i].split(".")[0];
    }

    for (let i = 0; i < articleIds.length; i++) {
        const id = articleIds[i];
        if (savedArticles.includes(id)) {
            bar.tick(1);
        } else {
            await fetchArticle(parseInt(id), options.dir);
            bar.tick(1);
        }
    }
};

const argv = yargs
    .command("search", "fetches article ids", {
        n_pages: {
            description: "number of pages to fetch",
            alias: "n",
            type: "number",
        },
        limit: {
            description: "max results per page",
            alias: "l",
            type: "number",
        },
        file: {
            description: "file to save ids to",
            alias: "f",
            type: "string",
        },
    })
    .command("fetch", "downloads articles from ids", {
        file: {
            description: "file containing article ids",
            alias: "f",
            type: "string",
        },
        dir: {
            description: "output dir to save articles to",
            alias: "d",
            type: "string",
        },
    })
    .help()
    .alias("help", "h").argv;

const main = async () => {
    fs.mkdir("articles", { recursive: true }, (err) => {
        if (err) console.error(err);
    });

    fs.mkdir("log", { recursive: true }, (err) => {
        if (err) console.error(err);
    });

    if (argv._.includes("search")) {
        var nPages = argv.n_pages || 1;
        var options = {
            limit: argv.limit || 5,
            file: argv.file || "search-results.txt",
            doctype: "article",
            offset: 0,
        };

        var bar = new ProgressBar("[:bar] :rate/bps :percent :etas", {
            total: nPages,
            complete: "=",
            incomplete: " ",
            width: 30,
        });

        var pagination = await search(options);
        bar.tick(1);
        for (let i = 1; i < nPages; i++) {
            options.offset = pagination.offset;
            pagination = await search(options);
            bar.tick(1);
        }
    } else if (argv._.includes("fetch")) {
        var options = {
            file: argv.file || "search-results.txt",
            dir: argv.dir || "articles",
        };
        await fetchArticlesFromIds(options);
    }
};

main();
