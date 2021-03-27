# abc-fetch
ABC News has a public API which can be accessed through this node.js script. Note that datasets created from these articles cannot be uploaded without the permission of the ABC (see the policy [here](https://help.abc.net.au/hc/en-us/articles/360001548096)). You're free to use the data for personal, non-commercial purposes.

## Install

```shell
$ npm install
```

## Run

```shell
$ node main.js search \  # fetches article ids from the api
    --n_pages \          # number of pages to retrieve (default 1)
    --page_size          # results per page (max 2000)
```

The search function will output all ids to a file named `search-results.txt` by default.

```shell
$ node main.js fetch \    # fetches articles from id file
    --file \              # file containing article ids
    --dir                 # folder to save the articles to       
```

Articles will be saved under `data/articles` as JSON files named using their article id. Articles that couldn't be retrived will have their ID saved to a file under `log` called `missing-articles.txt`.

The directory passed to `--dir` will be created if it doesn't exist.

## Article schema

```js
{
    id: string,
    title: string,
    synopsis: string,
    body: array[string],
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
};
```
