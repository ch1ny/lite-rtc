const gulp = require('gulp');
const ts = require('gulp-typescript');
const clean = require('gulp-clean');
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

gulp.task('clean-not-umd-js', function () {
	return gulp.src(['dist/**/*.js', '!dist/**/*.umd.js'], { read: false }).pipe(clean());
});

gulp.task(
	'default',
	gulp.series(
		gulp.parallel('clean'),
		gulp.parallel('tsc'),
		gulp.parallel('build'),
		gulp.parallel('clean-not-umd-js')
	)
);
