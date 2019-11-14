'use strict';

var gulp = require('gulp');
var sass = require('gulp-sass');

var paths = {
    nodeModulesPath: './node_modules/',
    scriptsPath: './src/scripts/',
    stylesPath: './src/css',
    fontsPath: './src/fonts'
};

gulp.task('sass', async function () {
    gulp.src('./src/sass/**/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest(paths.stylesPath));
});

gulp.task('sass:watch', async function () {
    gulp.watch('./sass/**/*.scss', gulp.series('sass'));
});