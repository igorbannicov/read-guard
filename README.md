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

## Stats

Like `rtk gain`, the plugin counts what it saved. Every denied read logs the size of the whole file; every later
partial read of that file in the same session is subtracted. Run `/read-guard:stats` in Claude Code, or
`node hooks/stats.js` from the plugin folder:

```
read-guard: estimated tokens (~4 chars per token)

Period      Denied   Whole files  Parts read       Saved  Saved
Today            1        19,408         934      18,474    95%
7 days           1        19,408         934      18,474    95%
All time         1        19,408         934      18,474    95%

Top files
      18,474  Source/PluginEditor.cpp
```

Tokens are estimated from characters. Grep output and Explore summaries aren't subtracted, so the real saving is
somewhat lower. The log is `~/.claude/read-guard/log.jsonl`.

## Settings

`READ_GUARD_LINES`: the line limit, 400 by default. Set it in your shell or in `settings.json`:

```json
{ "env": { "READ_GUARD_LINES": "600" } }
```

## License

MIT
