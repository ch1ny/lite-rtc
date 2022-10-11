const gulp = require('gulp');
const ts = require('gulp-typescript');
const clean = require('gulp-clean');
const uglify = require('gulp-uglify');
const browserify = require('browserify');
const tsify = require('tsify');
const buffer = require('vinyl-buffer');
const source = require('vinyl-source-stream');

const tsProject = ts.createProject('tsconfig.json');

gulp.task('clean', function () {
	return gulp.src('dist', { read: false, allowEmpty: true }).pipe(clean('dist'));
});

gulp.task('tsc', function () {
	return tsProject.src().pipe(tsProject()).pipe(gulp.dest('dist'));
});

gulp.task('clean-js', function () {
	return gulp.src('dist/**/*.js', { read: false }).pipe(clean('*.js'));
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

gulp.task(
	'default',
	gulp.series(
		gulp.parallel('clean'),
		gulp.parallel('tsc'),
		gulp.parallel('clean-js'),
		gulp.parallel('build')
	)
);
