const gulp = require('gulp')
const merge = require('merge-stream')
const ts = require('gulp-typescript')
const ugly = require('gulp-uglify')
const pump = require('pump')
const tslint = require('gulp-tslint')

const dest = './bin'

function buildHelper(cb) {
  const tsProj = ts.createProject('tsconfig.json',
    { declaration: false, target: 'es5' })
  const tsc = tsProj()
  gulp.src('./src/clientHelper.ts').pipe(tsc)
  pump(
    tsc.js,
    ugly(),
    gulp.dest(dest),
    cb)
}

gulp.task('build-helper', buildHelper)

gulp.task('build', ['build-helper'], () => {
  const tsProj = ts.createProject('tsconfig.json')
  const tsc = tsProj()
  tsProj.src().pipe(tsc)

  return merge(
    tsc.js.pipe(gulp.dest(dest)),
    tsc.dts.pipe(gulp.dest(dest))
  )
})

gulp.task('default', ['build'])

gulp.task('watch', () => {
  gulp.watch('./src/**/*.ts', ['build', 'tslint'])
})

gulp.task('tslint', () => {
  const tsProj = ts.createProject('tsconfig.json')
  return tsProj.src()
    .pipe(tslint({ formatter: 'prose' }))
    .pipe(tslint.report({ emitError: false }))
})
