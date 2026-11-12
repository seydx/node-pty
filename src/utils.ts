/**
 * Copyright (c) 2017, Daniel Imms (MIT License).
 * Copyright (c) 2018, Microsoft Corporation (MIT License).
 */

export function assign(target: any, ...sources: any[]): any {
  sources.forEach(source => Object.keys(source).forEach(key => target[key] = source[key]));
  return target;
}


export function loadNativeModule(name: string): {dir: string, module: any} {
  // Check build, debug, and then prebuilds.
  const dirs = ['build/Release', 'build/Debug', `prebuilds/${prebuildName()}`];
  // Check relative to the parent dir for unbundled and then the current dir for bundled
  const relative = ['..', '.'];
  let lastError: unknown;
  for (const d of dirs) {
    for (const r of relative) {
      const dir = `${r}/${d}`;
      try {
        return { dir, module: require(`${dir}/${name}.node`) };
      } catch (e) {
        lastError = e;
      }
    }
  }
  throw new Error(`Failed to load native module: ${name}.node, checked: ${dirs.join(', ')}: ${lastError}`);
}

/**
 * The prebuild folder for this platform. musl builds of Linux (e.g. Alpine) get their own folder
 * next to the glibc ones, the binaries are not interchangeable.
 */
function prebuildName(): string {
  const name = `${process.platform}-${process.arch}`;
  return process.platform === 'linux' && isMusl() ? `${name}-musl` : name;
}

let musl: boolean | undefined;

/**
 * Only a glibc build of Node.js carries a glibc runtime version in its diagnostic report. Network
 * details are left out of the report, resolving open sockets can take seconds.
 */
function isMusl(): boolean {
  if (musl !== undefined) {
    return musl;
  }
  musl = false;
  const report = (process as any).report;
  if (report) {
    const excludeNetwork = report.excludeNetwork;
    try {
      report.excludeNetwork = true;
      musl = !report.getReport().header.glibcVersionRuntime;
    } catch {
      // No report available, assume glibc
    } finally {
      report.excludeNetwork = excludeNetwork;
    }
  }
  return musl;
}
