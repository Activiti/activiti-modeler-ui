require('dotenv').config({ path: process.env.ENV_FILE });

const API_HOST = process.env.API_HOST;

module.exports = {
    "/modeling-service": {
        "target": API_HOST,
        "secure": false,
        "changeOrigin": true,
        "pathRewrite": {
            "^/modeling-service/modeling-service": ""
        },
        "logLevel": "silent"
    },
    "/dmn-service": {
        "target": API_HOST,
        "secure": false,
        "changeOrigin": true,
        "pathRewrite": {
            "^/dmn-service/dmn-service": ""
        },
        "logLevel": "silent"
    },
    "/alfresco": {
        "target": API_HOST,
        "secure": false,
        "pathRewrite": {
            "^/alfresco/alfresco": ""
        },
        "changeOrigin": true
    },
    "/script-service": {
        "target": API_HOST,
        "secure": false,
        "changeOrigin": true,
        "pathRewrite": {
            "^/script-service/script-service": ""
        },
        "logLevel": "silent"
    }
};
