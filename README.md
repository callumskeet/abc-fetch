# abc-fetch
ABC News has a publicly accessible API which can be accessed through this node.js script. Note that datasets created from these articles cannot be uploaded without the permission of the ABC (see the policy [here](https://help.abc.net.au/hc/en-us/articles/360001548096)). You're free to use the data for personal, non-commercial purposes.

## Install

```shell
$ npm install
```

## Run

```shell
$ node main.js search \    # fetches all article ids from the api
    --n_pages \          # number of pages to go through (default all)
    --page_size          # results per page (max 2000)
```

The search function will output all ids to a file under `data` named `search-results.txt`. 

```shell
$ node main.js process \    # processes fetched ids
    --file                # file containing article ids
```

Articles will be saved under `data/articles` as JSON files named using their article id.

## Schema

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