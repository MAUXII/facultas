# logfmt

Turn structured log lines into something you can read in a terminal.

[![crates.io](https://img.shields.io/crates/v/logfmt?style=flat-square&color=555555)](https://crates.io/crates/logfmt)

```console
$ cat app.log
{"ts":"12:04:31","level":"warn","svc":"db","msg":"slow query","duration_ms":812,"table":"orders"}
{"ts":"12:04:33","level":"error","svc":"api","msg":"timeout","route":"/checkout"}

$ cat app.log | logfmt
12:04:31 WARN   db   slow query  duration_ms=812 table=orders
12:04:33 ERROR  api  timeout     route=/checkout
```

## Install

```bash
cargo install logfmt           # Rust 1.78 or later
brew install example/tap/logfmt
```

Prebuilt binaries for Linux, macOS, and Windows are attached to each [release](https://github.com/example/logfmt/releases).

## Usage

```console
$ kubectl logs deploy/api -f | logfmt --follow --level warn
$ logfmt --fields ts,level,msg app.log
$ logfmt --format json app.log | jq '.duration_ms'
```

## Options

| Flag | Default | Description |
| --- | --- | --- |
| `--level <LEVEL>` | `trace` | Hide lines below this level |
| `--fields <LIST>` | all | Show only these fields, in this order |
| `--follow` | off | Keep reading as the input grows |
| `--format <FORMAT>` | `pretty` | `pretty` or `json` |
| `--no-color` | off | Plain output, also set by `NO_COLOR` |

Run `logfmt --help` for the full list.

## License

MIT or Apache 2.0, at your option.
