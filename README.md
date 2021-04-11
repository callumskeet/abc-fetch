# abc-fetch
Download recent news articles from the ABC's API. Note that datasets created from these articles cannot be uploaded without permission from the ABC (see [terms of use](https://help.abc.net.au/hc/en-us/articles/360001548096)). You're free to use the data for personal, non-commercial purposes.

Access to the v2 endpoint is currently not implemented making some more recent articles unavailable.

## Install

```shell
$ npm install
```

## Run

```shell
$ node main.js search \  # fetches article ids from the api
    [--n_pages] \        # number of pages to retrieve (default 1)
    [--limit] \          # results per page (default 5, max 2000)
    [--file]             # file to save ids to (default "./search-results.txt")
```

The search function will output all ids to a file named `search-results.txt` by default.

```shell
$ node main.js fetch \    # fetches articles from id file
     --id \               # an article id (last part of abc.net.au article url)
     --file \             # file containing article ids (either id or file should be passed)
    [--dir]               # folder to save the articles to       
```

Articles will be saved under `./articles` as JSON files named using their article id. Articles that couldn't be retrived will have their ID saved to a file under `./log` called `missing-articles.txt`.

The directory passed to `--dir` will be created if it doesn't exist.

## Article schema

```js
{
    id: string,
    title: string,
    synopsis: string,
    body: string,
    keywords: array[string],
    url: string,
    published: string -> ISO Format,
    updated: string -> ISO Format,
    genre: string,
    productionUnit: string,
    rightsHolder: array[string],
    lang: string,
    importance: int,
    version: int,
}
```
