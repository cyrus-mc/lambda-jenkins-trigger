let config = {
  localRun: process.env.LOCAL_RUN || false,
  jenkinsUrl: process.env.JENKINS_URL,
  jenkinsUser: process.env.JENKINS_USER,
  jenkinsPass: process.env.JENKINS_PASS
};

export default config;
