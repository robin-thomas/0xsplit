module.exports = (grunt) => {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    eslint: {
      target: ['./static/js/modules/*.js', './static/js/modules/**/*.js', './static/js/app.js'],
      options: {
        configFile: './eslint.json',
        globals: ['$', 'SimpleBar'],
      },
    },
    browserify: {
      target: {
        src: [ './static/js/app.js' ],
        dest: './static/js/index.js',
        options: {
          require: ['web3'],
        },
      },
    },
    uglify: {
      build: {
        src: './static/js/index.js',
        dest: './static/js/index.min.js'
      }
    },
  });

  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadNpmTasks('grunt-contrib-uglify-es');
  grunt.registerTask('default', [
    'eslint',
    'browserify',
    'uglify',
  ]);
};
