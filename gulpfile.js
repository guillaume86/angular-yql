var gulp = require('gulp');
var coffee = require('gulp-coffee');

gulp.task('build', function() {
  return gulp.src('./src/*.coffee')
    .pipe(coffee())
    .pipe(gulp.dest('./dist/'));
});

gulp.task('default', ['build']);
