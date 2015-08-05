module.exports = {
    
    featureHost: process.env.FEATURES_PORT_8080_TCP_ADDR,
    featurePort: process.env.FEATURES_PORT_8080_TCP_PORT,
    featurePath: '/api/feature?',
    port: process.env.PORT || 8080
};
