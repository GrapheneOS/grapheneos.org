# GrapheneOS.org

Source of https://grapheneos.org/

## Setup
Install dependencies

```bash
# Debian/Ubuntu
$ apt-get install libxml2-utils yajl-tools moreutils parallel zopfli brotli default-jre
```

Clone repo & run setup
```bash
$ git clone https://github.com/GrapheneOS/grapheneos.org
$ ./setup
```

## Development server

First make sure that flask is installed (it's not listed in requirements as it's a development only dependency)

```bash
$ pip3 install flask
```

Then run the server
```bash
# Start the dev server on localhost:5000
$ ./dev-server
# or
$ ./dev-server --host 0.0.0.0 --port 3000
```

