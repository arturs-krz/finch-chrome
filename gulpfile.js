var gulp = require('gulp')
var typescript = require('gulp-typescript')
var webpack = require('webpack-stream')
var uglify = require('gulp-uglify')
var sass = require('gulp-sass')

gulp.task('devtools_build', function () {
    gulp.src('src/devtools/**/*.ts')
        .pipe(typescript('./tsconfig.json'))
        .pipe(gulp.dest('./.tmp/devtools'))
        .pipe(webpack({
            resolve: {
                root: [
                    "./.tmp/devtools/"
                ]
            },
            output: {
                filename: 'devtools.js'
            }
        }))
        //.pipe(uglify({}))
        .pipe(gulp.dest('./dist'))
})
gulp.task('content_build', function () {
    gulp.src('src/content/**/*.ts')
        .pipe(typescript('./tsconfig.json'))
        .pipe(gulp.dest('./.tmp/content'))
        .pipe(webpack({
            resolve: {
                root: [
                    "./.tmp/content/"
                ]
            },
            output: {
                filename: 'content.js'
            }
        }))
        //.pipe(uglify({}))
        .pipe(gulp.dest('./dist'))
})
gulp.task('background_build', function () {
    gulp.src('src/background/**/*.ts')
        .pipe(typescript('./tsconfig.json'))
        .pipe(gulp.dest('./.tmp/background'))
        .pipe(webpack({
            resolve: {
                root: [
                    "./.tmp/background/"
                ]
            },
            output: {
                filename: 'background.js'
            }
        }))
        //.pipe(uglify({}))
        .pipe(gulp.dest('./dist'))
})

// gulp.task('sass', function () {
//    gulp.src('style/*.scss')
//    .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
//    .pipe(gulp.dest('./dist/css/'))
//    .pipe(browserSync.stream())
// })

gulp.task('default', ['devtools_build', 'content_build', 'background_build'], function () {

    //    gulp.watch('style/**/*.scss', ['sass'])
    gulp.watch('src/content/**/*.ts', ['content_build'])
    gulp.watch('src/devtools/**/*.ts', ['devtools_build'])
    gulp.watch('src/background/**/*.ts', ['background_build'])

})
