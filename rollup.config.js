import pkg from './package.json';
import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import minify from 'rollup-plugin-babel-minify';

const banner = `/*! ${pkg.name} v${pkg.version} | ${pkg.homepage} */`;

export default {
    input: 'src/voodoo.js',
    output: [
        {
            banner,
            name: 'voodoo',
            file: pkg.browser,
            format: 'umd'
        },
        {
            banner,
            file: pkg.main,
            format: 'cjs'
        },
        {
            banner,
            file: pkg.module,
            format: 'esm'
        }
    ],
    plugins: [
        resolve(),
        babel({
            exclude: 'node_modules/**'
        }),
        commonjs(),
        minify()
    ]
};
