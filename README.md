# read-guard

A tiny Claude Code plugin that saves tokens by stopping Claude from reading big files whole.

When Claude calls `Read` on a text file longer than 400 lines without `offset`/`limit`, the hook denies the read
and tells Claude what to do instead:

- find the place with `Grep -n` and read just that part with `offset`/`limit`;
- to understand the whole file, ask the built-in **Explore** agent for a summary;
- if the whole file is really needed, read it in parts.

Partial reads, images, PDFs and notebooks pass through untouched. Everything runs locally: no service, no API key,
nothing leaves your machine. It's a local take on the idea behind Spotify's
[shunt](https://engineering.atspotify.com/2026/9/portal-by-spotify-cut-my-claude-code-token-usage-by-90)
(which delegates bulk reads to a cheaper model through Spotify Portal).

## Install

```bash
claude plugin marketplace add igorbannicov/read-guard
claude plugin install read-guard@read-guard
```

Needs Node.js on the PATH. Start a new session after installing.

## Settings

`READ_GUARD_LINES`: the line limit, 400 by default. Set it in your shell or in `settings.json`:

```json
{ "env": { "READ_GUARD_LINES": "600" } }
```

## License

MIT
