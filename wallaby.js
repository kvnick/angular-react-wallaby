module.exports = () => ({
  autoDetect: true,
  files: {
    override: (filePatterns) => {
      filePatterns.push({ pattern: 'src/**/*.spec.tsx', ignore: true });
      filePatterns.push({ pattern: 'src/**/*.tsx', load: false });
      return filePatterns;
    }
  },
  tests: {
    override: (testPatterns) => {
      testPatterns.push({ pattern: 'src/**/*.spec.tsx', load: false });
      return testPatterns;
    }
  }
});
