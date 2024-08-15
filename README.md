<div align="center">
  <a href="https://github.com/michaelhthomas/vue-to-astro">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="./images/logo-dark.svg">
      <img alt="Project Logo" src="./images/logo-light.svg" width="256" height="128">
    </picture>
  </a>

  <h3 align="center">Vue to Astro Converter</h3>

  <p align="center">
    Automatically convert Vue template syntax to Astro.
    <br />
    <a href="https://michaelhthomas.github.io/vue-to-astro/">View Demo</a>
    ·
    <a href="https://github.com/michaelhthomas/vue-to-astro/issues/new?labels=bug&template=bug-report---.md">Report Bug</a>
    ·
    <a href="https://github.com/michaelhthomas/vue-to-astro/issues/new?labels=enhancement&template=feature-request---.md">Request Feature</a>
  </p>
</div>

A simple, browser-based conversion tool which transforms a Vue SFC's
`<template>` block into valid Astro JSX. This makes the process of migrating
content-heavy Vue sites to Astro much more pleasant.

## Usage

1. [Visit the demo](https://michaelhthomas.github.io/vue-to-astro/)
1. Paste the code for a Vue component in the left pane
1. See the equivalent Astro template in the right pane

## Deployment

```bash
pnpm install
pnpm run build
```

You can deploy the produced `dist` folder to any static host provider (netlify, surge,
now, etc.) or serve it using a web server.

## Contributing

1. Fork this repo
1. Clone your fork
1. Install dependencies --- `pnpm install`
1. Start the development server --- `pnpm dev`
1. Make some changes
1. Submit your changes by pushing them to a well-named branch in your fork, then creating a PR

## Acknowledgments

- `@vue/compiler-sfc` --- Parsing and transforming Vue SFC syntax
- `prettier-plugin-astro` --- Pretty-printing Astro syntax
