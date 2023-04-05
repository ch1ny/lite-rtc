const gulp = require('gulp');
const ts = require('gulp-typescript');
const clean = require('gulp-clean');
const sourcemaps = require('gulp-sourcemaps');
const alias = require('@gulp-plugin/alias');
const path = require('path');
const webpack = require('webpack');
const gulpWebpack = require('webpack-stream');

const tsProject = ts.createProject('tsconfig.json');

gulp.task('clean', function () {
	return gulp.src('dist', { read: false, allowEmpty: true }).pipe(clean('dist'));
});

gulp.task('tsc', function () {
	return tsProject
		.src()
		.pipe(alias(tsProject.config))
		.pipe(sourcemaps.init())
		.pipe(tsProject())
		.pipe(
			sourcemaps.write({
				sourceRoot: (file) => path.relative(path.join(file.cwd, file.path), file.base),
			})
		)
		.pipe(gulp.dest('dist'));
});

gulp.task('build-umd', () => {
	return gulp
		.src('dist/index.js')
		.pipe(
			gulpWebpack(
				{
					output: {
						filename: 'index.umd.js',
						library: {
							type: 'umd',
							name: 'LiteRTC',
						},
					},
					mode: 'production',
				},
				webpack
			)
		)
		.pipe(gulp.dest('dist'));
});

gulp.task('clean-js', function () {
	return gulp.src(['dist/**/*.js', '!dist/index.js'], { read: false }).pipe(clean());
});

gulp.task(
	'default',
	gulp.series(gulp.parallel('clean'), gulp.parallel('tsc'), gulp.parallel('build-umd'))
);
