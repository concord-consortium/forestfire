# Forest Fire Model

Latest **stable** version:

https://forestfire.concord.org

A particular model can be loaded using `preset` URL parameter, e.g.:

https://forestfire.concord.org/index.html?preset=defaultThreeZone

Latest **development** version:

https://forestfire.concord.org/branch/master/index.html

## Configuration

Available presets:

https://github.com/concord-consortium/forestfire/blob/production/src/presets.ts

All the available options can be seen here (including default values):

https://github.com/concord-consortium/forestfire/blob/production/src/config.ts

Note that these URLs point to production branch. If you're working with `master` or other branch, you might
want to replace `production` with your branch name.

The final configuration is build using default configuration, preset options and URL parameters.
URL parameters have higher priority than preset options (so it's possible to customize a preset).

## Testing a preset

It's possible to dynamically load a new preset in the browser. Open browser console (e.g. in Chrome: Ctrl Shift J on
Windows or Ctrl Option J on Mac) and type:

```
sim.load({
  modelWidth: 120000,
  modelHeight: 80000,
  gridWidth: 240,
  heightmapMaxElevation: 20000,
  zones: [
    { terrainType: TerrainType.Foothills, vegetation: Vegetation.Grass, droughtLevel: DroughtLevel.SevereDrought },
    { terrainType: TerrainType.Foothills, vegetation: Vegetation.Shrub, droughtLevel: DroughtLevel.MediumDrought },
  ],
  zoneIndex: [
    [ 0, 1 ]
  ]
})
```

This will load set of provided options. You can use examples from preset.ts file (see section above). It can be useful
to test new presets before modifying `preset.ts` file.

### Development

1. Clone this repo and `cd` into it
2. Run `npm install` to pull dependencies
3. Run `npm start` to run `webpack-dev-server` in development mode with hot module replacement

### Building

If you want to build a local version run `npm build`, it will create the files in the `dist` folder.
You *do not* need to build to deploy the code, that is automatic.  See more info in the Deployment section below.

## Deployment

Production releases to S3 are based on the contents of the /dist folder and are built automatically by Travis
for each branch pushed to GitHub and each merge into production.

Merges into production are deployed to https://forestfire.concord.org.

Other branches are deployed to https://forestfire.concord.org/branch/<name>.

You can view the status of all the branch deploys [here](https://travis-ci.org/concord-consortium/forestfire/branches).

To deploy a production release:

1. Increment version number in package.json
2. Create new entry in CHANGELOG.md
3. Run `git log --pretty=oneline --reverse <last release tag>...HEAD | grep '#' | grep -v Merge` and add contents (after edits if needed to CHANGELOG.md)
4. Run `npm run build`
5. Copy asset size markdown table from previous release and change sizes to match new sizes in `dist`
6. Create `release-<version>` branch and commit changes, push to GitHub, create PR and merge
7. Checkout master and pull
8. Checkout production
9. Run `git merge master --no-ff`
10. Push production to GitHub
11. Use https://github.com/concord-consortium/forestfire/releases to create a new release tag

### Testing

Run `npm test` to run jest tests. Run `npm run test:full` to run jest and Cypress tests.

##### Cypress Run Options

Inside of your `package.json` file:
1. `--browser browser-name`: define browser for running tests
2. `--group group-name`: assign a group name for tests running
3. `--spec`: define the spec files to run
4. `--headed`: show cypress test runner GUI while running test (will exit by default when done)
5. `--no-exit`: keep cypress test runner GUI open when done running
6. `--record`: decide whether or not tests will have video recordings
7. `--key`: specify your secret record key
8. `--reporter`: specify a mocha reporter

##### Cypress Run Examples

1. `cypress run --browser chrome` will run cypress in a chrome browser
2. `cypress run --headed --no-exit` will open cypress test runner when tests begin to run, and it will remain open when tests are finished running.
3. `cypress run --spec 'cypress/integration/examples/smoke-test.js'` will point to a smoke-test file rather than running all of the test files for a project.

## License

Starter Projects are Copyright 2020 (c) by the Concord Consortium and is distributed under the [MIT license](http://www.opensource.org/licenses/MIT).

See license.md for the complete license text.
