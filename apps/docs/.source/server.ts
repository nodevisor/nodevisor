// @ts-nocheck
import * as __fd_glob_33 from "../content/docs/packages/users.mdx?collection=docs"
import * as __fd_glob_32 from "../content/docs/packages/ufw.mdx?collection=docs"
import * as __fd_glob_31 from "../content/docs/packages/ssh.mdx?collection=docs"
import * as __fd_glob_30 from "../content/docs/packages/shell.mdx?collection=docs"
import * as __fd_glob_29 from "../content/docs/packages/services.mdx?collection=docs"
import * as __fd_glob_28 from "../content/docs/packages/schema.mdx?collection=docs"
import * as __fd_glob_27 from "../content/docs/packages/registry.mdx?collection=docs"
import * as __fd_glob_26 from "../content/docs/packages/pwsh.mdx?collection=docs"
import * as __fd_glob_25 from "../content/docs/packages/packages.mdx?collection=docs"
import * as __fd_glob_24 from "../content/docs/packages/os.mdx?collection=docs"
import * as __fd_glob_23 from "../content/docs/packages/nodevisor.mdx?collection=docs"
import * as __fd_glob_22 from "../content/docs/packages/index.mdx?collection=docs"
import * as __fd_glob_21 from "../content/docs/packages/groups.mdx?collection=docs"
import * as __fd_glob_20 from "../content/docs/packages/fs.mdx?collection=docs"
import * as __fd_glob_19 from "../content/docs/packages/firewall.mdx?collection=docs"
import * as __fd_glob_18 from "../content/docs/packages/env.mdx?collection=docs"
import * as __fd_glob_17 from "../content/docs/packages/endpoint.mdx?collection=docs"
import * as __fd_glob_16 from "../content/docs/packages/docker.mdx?collection=docs"
import * as __fd_glob_15 from "../content/docs/packages/cluster.mdx?collection=docs"
import * as __fd_glob_14 from "../content/docs/packages/cli.mdx?collection=docs"
import * as __fd_glob_13 from "../content/docs/packages/builder.mdx?collection=docs"
import * as __fd_glob_12 from "../content/docs/packages/aws.mdx?collection=docs"
import * as __fd_glob_11 from "../content/docs/packages/authorized-keys.mdx?collection=docs"
import * as __fd_glob_10 from "../content/docs/packages/auth.mdx?collection=docs"
import * as __fd_glob_9 from "../content/docs/examples/server-bootstrap.mdx?collection=docs"
import * as __fd_glob_8 from "../content/docs/examples/index.mdx?collection=docs"
import * as __fd_glob_7 from "../content/docs/examples/docker-cluster.mdx?collection=docs"
import * as __fd_glob_6 from "../content/docs/workspace-strategy.mdx?collection=docs"
import * as __fd_glob_5 from "../content/docs/index.mdx?collection=docs"
import * as __fd_glob_4 from "../content/docs/getting-started.mdx?collection=docs"
import * as __fd_glob_3 from "../content/docs/architecture.mdx?collection=docs"
import { default as __fd_glob_2 } from "../content/docs/packages/meta.json?collection=docs"
import { default as __fd_glob_1 } from "../content/docs/examples/meta.json?collection=docs"
import { default as __fd_glob_0 } from "../content/docs/meta.json?collection=docs"
import { server } from 'fumadocs-mdx/runtime/server';
import type * as Config from '../source.config';

const create = server<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>({"doc":{"passthroughs":["extractedReferences"]}});

export const docs = await create.docs("docs", "content/docs", {"meta.json": __fd_glob_0, "examples/meta.json": __fd_glob_1, "packages/meta.json": __fd_glob_2, }, {"architecture.mdx": __fd_glob_3, "getting-started.mdx": __fd_glob_4, "index.mdx": __fd_glob_5, "workspace-strategy.mdx": __fd_glob_6, "examples/docker-cluster.mdx": __fd_glob_7, "examples/index.mdx": __fd_glob_8, "examples/server-bootstrap.mdx": __fd_glob_9, "packages/auth.mdx": __fd_glob_10, "packages/authorized-keys.mdx": __fd_glob_11, "packages/aws.mdx": __fd_glob_12, "packages/builder.mdx": __fd_glob_13, "packages/cli.mdx": __fd_glob_14, "packages/cluster.mdx": __fd_glob_15, "packages/docker.mdx": __fd_glob_16, "packages/endpoint.mdx": __fd_glob_17, "packages/env.mdx": __fd_glob_18, "packages/firewall.mdx": __fd_glob_19, "packages/fs.mdx": __fd_glob_20, "packages/groups.mdx": __fd_glob_21, "packages/index.mdx": __fd_glob_22, "packages/nodevisor.mdx": __fd_glob_23, "packages/os.mdx": __fd_glob_24, "packages/packages.mdx": __fd_glob_25, "packages/pwsh.mdx": __fd_glob_26, "packages/registry.mdx": __fd_glob_27, "packages/schema.mdx": __fd_glob_28, "packages/services.mdx": __fd_glob_29, "packages/shell.mdx": __fd_glob_30, "packages/ssh.mdx": __fd_glob_31, "packages/ufw.mdx": __fd_glob_32, "packages/users.mdx": __fd_glob_33, });