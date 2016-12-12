'use strict';

const gulp = require('gulp'),
		 sass = require('gulp-sass');

gulp.task('hello', function () {
	console.log('hello');
});

gulp.task('sass', function () {
	return gulp.src(['sass/**/*.sass', 'sass/**/*.scss'])
				.pipe(sass({outputStyle: 'expanded'}).on('error', sass.logError))
				.pipe(gulp.dest('starwars'))
});

gulp.task('watch', function () {
	gulp.watch(['sass/**/*.sass', 'sass/**/*.scss', ['sass']])
});

gulp.task('default', ['watch']);