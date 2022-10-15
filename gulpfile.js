const gulp = require('gulp');
const ts = require('gulp-typescript');
const clean = require('gulp-clean');
const uglify = require('gulp-uglify');
const browserify = require('browserify');
const tsify = require('tsify');
const buffer = require('vinyl-buffer');
const source = require('vinyl-source-stream');
const webpack = require('webpack');
const gulpWebpack = require('webpack-stream');

const tsProject = ts.createProject('tsconfig.json');

gulp.task('clean', function () {
	return gulp.src('dist', { read: false, allowEmpty: true }).pipe(clean('dist'));
});

gulp.task('tsc', function () {
	return tsProject.src().pipe(tsProject()).pipe(gulp.dest('dist'));
});

gulp.task('build', () => {
	return gulp
		.src('dist/index.js')
		.pipe(
			gulpWebpack(
				{
					output: {
						filename: 'index.js',
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

gulp.task('build', () => {
	return browserify({
		basedir: '.',
		debug: true,
		entries: ['src/index.ts'],
		cache: {},
		packageCache: {},
	})
		.plugin(tsify)
		.bundle()
		.pipe(source('index.js'))
		.pipe(buffer())
		.pipe(uglify())
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
	gulp.series(
		gulp.parallel('clean'),
		gulp.parallel('tsc'),
		gulp.parallel('clean-js'),
		gulp.parallel('build'),
		gulp.parallel('build-umd')
	)
);
