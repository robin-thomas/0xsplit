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
    run: {
      options: {

      },
      npmtest: {
        cmd: 'npm',
        args: [
          'test',
        ],
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
      target: {
        src: './static/js/index.js',
        dest: './static/js/index.min.js'
      }
    },
  });

  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadNpmTasks('grunt-run');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-uglify-es');
  grunt.registerTask('default', [
    'eslint',
    'run:npmtest',
    'browserify',
    'uglify',
  ]);
};
