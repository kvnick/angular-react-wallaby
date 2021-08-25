const wallabyWebpack = require("wallaby-webpack");
const path = require("path");
const fs = require("fs");

module.exports = function (wallaby) {
    const specPattern = "/**/*spec.ts";
    const specJsxPattern = "/**/*spec.tsx";
    const angularConfig = require("./angular.json");

    const projects = Object.keys(angularConfig.projects)
        .map((key) => {
            return { name: key, ...angularConfig.projects[key] };
        })
        .filter((project) => project.sourceRoot)
        .filter(
            (project) =>
                project.projectType !== "application" ||
                (project.architect &&
                    project.architect.test &&
                    project.architect.test.builder === "@angular-devkit/build-angular:karma"),
        );

    const applications = projects.filter((project) => project.projectType === "application");
    const libraries = projects.filter((project) => project.projectType === "library");

    const tsConfigFile = projects
        .map((project) => path.join(__dirname, project.root, "tsconfig.spec.json"))
        .find((tsConfig) => fs.existsSync(tsConfig));

    const tsConfigSpec = tsConfigFile ? JSON.parse(fs.readFileSync(tsConfigFile)) : {};

    const compilerOptions = Object.assign(require("./tsconfig.json").compilerOptions, tsConfigSpec.compilerOptions);
    compilerOptions.emitDecoratorMetadata = true;

    return {
        files: [
            { pattern: "./src/enzyme_setup.ts", ignore: false },
            { pattern: "./generate.config.json", ignore: false },
            { pattern: path.basename(__filename), load: false, instrument: false },
            ...projects.map((project) => ({
                pattern: project.sourceRoot + "/**/*.+(ts|tsx|js|css|less|scss|sass|styl|html|json|svg)",
                load: false,
            })),
            ...projects.map((project) => ({
                pattern: project.sourceRoot + specPattern,
                ignore: true,
            })),
            ...projects.map((project) => ({
                pattern: project.sourceRoot + specJsxPattern,
                ignore: true,
            })),
            ...projects.map((project) => ({
                pattern: project.sourceRoot + "/**/*.d.ts",
                ignore: true,
            })),
        ],

        tests: [
            ...projects.map((project) => ({
                pattern: project.sourceRoot + specPattern,
                load: false,
            })),
            ...projects.map((project) => ({
                pattern: project.sourceRoot + specJsxPattern,
                load: false,
            })),
        ],

        compilers: {
            "**/*.ts": wallaby.compilers.typeScript({
                ...compilerOptions,
                getCustomTransformers: (program) => {
                    return {
                        before: [
                            require("@ngtools/webpack/src/transformers/replace_resources").replaceResources(
                                (path) => true,
                                () => program.getTypeChecker(),
                                false,
                            ),
                        ],
                    };
                },
            }),
            "**/*.tsx": wallaby.compilers.typeScript({
                ...compilerOptions,
                getCustomTransformers: (program) => {
                    return {
                        before: [
                            require("@ngtools/webpack/src/transformers/replace_resources").replaceResources(
                                (path) => true,
                                () => program.getTypeChecker(),
                                false,
                            ),
                        ],
                    };
                },
            }),
        },

        preprocessors: {
            // "**/*.js?(x)": (file) =>
            //     require("@babel/core").transform(file.content, {
            //         sourceMap: true,
            //         compact: false,
            //         filename: file.path,
            //         presets: ["react-app"],
            //     }),
            /* Initialize Test Environment for Wallaby */
            [path.basename(__filename)]: (file) => `
         import 'zone.js/dist/zone-testing';
         import { getTestBed } from '@angular/core/testing';
         import { BrowserDynamicTestingModule,  platformBrowserDynamicTesting} from '@angular/platform-browser-dynamic/testing';
         import './src/enzyme_setup.ts';

         getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());`,
        },

        middleware: function (app, express) {
            const path = require("path");

            applications.forEach((application) => {
                if (
                    !application.architect ||
                    !application.architect.test ||
                    !application.architect.test.options ||
                    !application.architect.test.options.assets
                ) {
                    return;
                }

                application.architect.test.options.assets.forEach((asset) => {
                    if (asset && !asset.glob) {
                        // Only works for file assets (not globs)
                        // (https://github.com/angular/angular-cli/blob/master/docs/documentation/stories/asset-configuration.md#project-assets)
                        app.use(
                            asset.slice(application.sourceRoot.length),
                            express.static(path.join(__dirname, asset)),
                        );
                    }
                });
            });
        },

        env: {
            kind: "chrome",
        },

        testFramework: "jasmine",

        postprocessor: wallabyWebpack({
            entryPatterns: [
                ...applications
                    .map((project) => project.sourceRoot + "/polyfills.js")
                    .filter((polyfills) => fs.existsSync(path.join(__dirname, polyfills.replace(/js$/, "ts")))),
                path.basename(__filename),
                ...projects.map((project) => project.sourceRoot + specPattern.replace(/ts$/, "js")),
                ...projects.map((project) => project.sourceRoot + specPattern.replace(/tsx$/, "jsx")),
            ],

            module: {
                rules: [
                    { test: /\.css$/, loader: ["raw-loader"] },
                    { test: /\.html$/, loader: "raw-loader" },
                    {
                        test: /\.ts?$/,
                        loader: "@ngtools/webpack",
                        include: /node_modules/,
                        query: { tsConfigPath: "tsconfig.json" },
                    },
                    // {
                    //     test: /\.ts$/,
                    //     loader: "@ngtools/webpack",
                    //     include: /node_modules/,
                    //     query: { tsConfigPath: "tsconfig.json" },
                    // },
                    {
                        test: /\.tsx$/,
                        loader: "@ngtools/webpack",
                        include: /node_modules/,
                        query: { tsConfigPath: "tsconfig.json" },
                    },
                    { test: /\.styl$/, loaders: ["raw-loader", "stylus-loader"] },
                    { test: /\.less$/, loaders: ["raw-loader", { loader: "less-loader" }] },
                    {
                        test: /\.scss$|\.sass$/,
                        loaders: [
                            { loader: "raw-loader" },
                            {
                                loader: "sass-loader",
                                options: {
                                    implementation: require("sass"),
                                    sassOptions: { includePaths: ["src/styles"] },
                                },
                            },
                        ],
                    },
                    { test: /\.(jpg|png|svg)$/, loader: "raw-loader" },
                ],
            },

            // plugins: [
            //     new AngularWebpackPlugin({
            //         tsConfigPath: tsConfigFile,
            //     }),
            // ],

            resolve: {
                extensions: [".ts", ".tsx", ".js"],
                modules: [
                    wallaby.projectCacheDir,
                    ...(projects.length
                        ? projects
                              .filter((project) => project.root)
                              .map((project) => path.join(wallaby.projectCacheDir, project.root))
                        : []),
                    ...(projects.length
                        ? projects
                              .filter((project) => project.sourceRoot)
                              .map((project) => path.join(wallaby.projectCacheDir, project.sourceRoot))
                        : []),
                    "node_modules",
                ],
                alias: libraries.reduce((result, project) => {
                    const alias = project.name.replace(/([a-zA-Z])(?=[A-Z])/g, "$1-").toLowerCase();
                    result[alias] = path.join(wallaby.projectCacheDir, project.sourceRoot, "public-api");
                    return result;
                }, {}),
            },
        }),

        setup: function () {
            window.__moduleBundler.loadTests();
        },

        debug: true,
    };
};