"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var components_1 = require("./src/components");
exports.default = {
    logo: <components_1.Logo />,
    docsRepositoryBase: 'https://github.com/nodevisor/nodevisor/tree/main/apps/docs',
    project: {
        link: 'https://github.com/nodevisor/nodevisor',
    },
    footer: {
        component: <components_1.Footer />,
    },
    toc: {
        backToTop: true,
    },
};
