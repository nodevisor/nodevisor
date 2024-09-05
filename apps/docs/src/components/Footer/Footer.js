"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Footer;
var link_1 = require("next/link");
function Footer() {
    return (<div className="mx-auto px-4 max-w-8xl pb-4">
      {new Date().getFullYear()} ©{' '}
      <link_1.default href="https://www.nodevisor.com" target="_blank">
        Nodevisor
      </link_1.default>
    </div>);
}
