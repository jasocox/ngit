// https://github.com/edwardhotchkiss/grunt-develop

node_env.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    watch: {
      js: {
        files: [
          'app.js',
          'routes/**/*.js',
          'lib/*.js'
        ],
        tasks: ['tests']
      }
    },
    tests: {
      // Uh...
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-develop');

  grunt.registerTask('default', ['tests']);
}
