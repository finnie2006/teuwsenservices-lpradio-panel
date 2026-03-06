# LP Radio Panel

Interactieve LP-radio panel plugin voor Grafana.
<img width="923" height="294" alt="image" src="https://github.com/user-attachments/assets/1fee096a-4558-4c24-8491-615f5b47aa5e" />
<img width="1867" height="1080" alt="image" src="https://github.com/user-attachments/assets/3af14908-8ec9-43c5-a946-c66bcbb55813" />


## Wat deze plugin doet

- Toont een klikbare LP (vinyl) die audio streamt.
- Kiest automatisch een zender per weekdag.
- Ondersteunt een timed override vanaf een instelbaar uur op zelfgekozen dag(en).
- Ondersteunt één gedeeld station voor alle dagen.
- Kan de huidige track van NPO Sterren NL tonen (artiest, titel en albumhoes).
- Kan audio laten doorlopen tussen dashboardwissels in Grafana playlists.
- Laat gouden styling zien als de zendernaam matcht met een instelbare tekst.
- Ondersteunt styling-opties voor randen (panel, disc, label).
- Ondersteunt Grafana variabelen in zendernaam, stream-URL en logo-URL (bijv. `${station_url}`).

## Instelbare opties (Panel options)

- **Display**: loading tekst, klik-tekst, ON AIR prefix, disc-grootte, schedule check interval, gold match tekst, playlist doorloop-optie.
- **Now playing (per station)**: per zender een preset-keuze (NPO Sterren NL, Arrow Classic Rock) en optionele API URL override.
- **Styling**: randkleur/randdikte voor panel, disc en label.
- **Schedule override**: aan/uit, startuur, dagselectie en override zendergegevens.
- **Stations**: gedeeld station voor alle dagen óf losse zenders per dag.

## NPO Sterren NL now playing mapping

Bij preset **NPO Sterren NL** wordt de API uitgelezen:

- `artist` → artiest
- `song` → titel
- `radioTracks.coverUrl` → albumhoes

Standaard endpoint:

- `https://www.nporadio5.nl/sterrennl/api/miniplayer/info?channel=npo-sterren-nl`

## Arrow Classic Rock now playing mapping

Bij preset **Arrow Classic Rock** wordt de API uitgelezen:

- `artist` → artiest
- `title` → titel
- `image` → albumhoes (automatisch omgezet naar `https://player.arrow.nl/...`)

Standaard endpoint:

- `https://player.arrow.nl/index.php?c=Arrow%20Classic%20Rock&_=`

## Voorbeeld variabelen

Als je dashboard variabelen gebruikt:

- `stations.monday.url` = `${monday_stream}`
- `stations.monday.logo` = `${monday_logo}`
- `stations.monday.name` = `${monday_name}`

Dan vervangt de plugin deze runtime met `replaceVariables`.

## Zip maken voor Windows Grafana

Gebruik één command om te builden en een installeerbare zip te maken:

```bash
npm run package:zip
```

Dit maakt een bestand als `teuwsenservices-lpradio-panel-1.0.0.zip` in de project-root.

# Grafana panel plugin template

This template is a starting point for building a panel plugin for Grafana.

## What are Grafana panel plugins?

Panel plugins allow you to add new types of visualizations to your dashboard, such as maps, clocks, pie charts, lists, and more.

Use panel plugins when you want to do things like visualize data returned by data source queries, navigate between dashboards, or control external systems (such as smart home devices).

## Getting started

### Frontend

1. Install dependencies

   ```bash
   npm install
   ```

2. Build plugin in development mode and run in watch mode

   ```bash
   npm run dev
   ```

3. Build plugin in production mode

   ```bash
   npm run build
   ```

4. Run the tests (using Jest)

   ```bash
   # Runs the tests and watches for changes, requires git init first
   npm run test

   # Exits after running all the tests
   npm run test:ci
   ```

5. Spin up a Grafana instance and run the plugin inside it (using Docker)

   ```bash
   npm run server
   ```

6. Run the E2E tests (using Playwright)

   ```bash
   # Spins up a Grafana instance first that we tests against
   npm run server

   # If you wish to start a certain Grafana version. If not specified will use latest by default
   GRAFANA_VERSION=11.3.0 npm run server

   # Starts the tests
   npm run e2e
   ```

7. Run the linter

   ```bash
   npm run lint

   # or

   npm run lint:fix
   ```

# Distributing your plugin

When distributing a Grafana plugin either within the community or privately the plugin must be signed so the Grafana application can verify its authenticity. This can be done with the `@grafana/sign-plugin` package.

_Note: It's not necessary to sign a plugin during development. The docker development environment that is scaffolded with `@grafana/create-plugin` caters for running the plugin without a signature._

## Initial steps

Before signing a plugin please read the Grafana [plugin publishing and signing criteria](https://grafana.com/legal/plugins/#plugin-publishing-and-signing-criteria) documentation carefully.

`@grafana/create-plugin` has added the necessary commands and workflows to make signing and distributing a plugin via the grafana plugins catalog as straightforward as possible.

Before signing a plugin for the first time please consult the Grafana [plugin signature levels](https://grafana.com/legal/plugins/#what-are-the-different-classifications-of-plugins) documentation to understand the differences between the types of signature level.

1. Create a [Grafana Cloud account](https://grafana.com/signup).
2. Make sure that the first part of the plugin ID matches the slug of your Grafana Cloud account.
   - _You can find the plugin ID in the `plugin.json` file inside your plugin directory. For example, if your account slug is `acmecorp`, you need to prefix the plugin ID with `acmecorp-`._
3. Create a Grafana Cloud API key with the `PluginPublisher` role.
4. Keep a record of this API key as it will be required for signing a plugin

## Signing a plugin

### Using Github actions release workflow

If the plugin is using the github actions supplied with `@grafana/create-plugin` signing a plugin is included out of the box. The [release workflow](./.github/workflows/release.yml) can prepare everything to make submitting your plugin to Grafana as easy as possible. Before being able to sign the plugin however a secret needs adding to the Github repository.

1. Please navigate to "settings > secrets > actions" within your repo to create secrets.
2. Click "New repository secret"
3. Name the secret "GRAFANA_API_KEY"
4. Paste your Grafana Cloud API key in the Secret field
5. Click "Add secret"

#### Push a version tag

To trigger the workflow we need to push a version tag to github. This can be achieved with the following steps:

1. Run `npm version <major|minor|patch>`
2. Run `git push origin main --follow-tags`

## Learn more

Below you can find source code for existing app plugins and other related documentation.

- [Basic panel plugin example](https://github.com/grafana/grafana-plugin-examples/tree/master/examples/panel-basic#readme)
- [`plugin.json` documentation](https://grafana.com/developers/plugin-tools/reference/plugin-json)
- [How to sign a plugin?](https://grafana.com/developers/plugin-tools/publish-a-plugin/sign-a-plugin)
