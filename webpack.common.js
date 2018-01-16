const path = require("path")
const CleanWebpackPlugin = require("clean-webpack-plugin")
const HtmlWebpackPlugin = require("html-webpack-plugin")
const CopyWebpackPlugin = require("copy-webpack-plugin")

module.exports = {
    entry: {
        app: "./src/main.js"
    },
    plugins: [
        new CleanWebpackPlugin(["dist"]),
        new CopyWebpackPlugin([{
            from: "./assets",
            to: "./assets"
        }]),
        new HtmlWebpackPlugin({
            title: "WebGL",
            template: "template.ejs"
        })
    ],
    module: {
        rules: [
            {
                test: /\.(glsl|frag|vert)$/,
                use: ["raw-loader", "glslify-loader"],
                exclude: /node_modules/
            }
        ]
    },
    output: {
        filename: "app.js",
        path: path.resolve(__dirname, "dist")
    }
}